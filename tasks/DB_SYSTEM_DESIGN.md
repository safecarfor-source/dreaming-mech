# DB 시스템 설계도 (구조 계약서)
> 이 문서는 극동 데이터 동기화 시스템의 구조를 정의합니다.
> 모든 코드는 이 설계도를 기준으로 구현되며, 구조를 변경할 때는 이 문서를 먼저 수정합니다.
> 작성일: 2026-03-24

---

## 1. 시스템 전체 구조

```
┌──────────────────────────────────────────────────────────┐
│ 정비소 PC (극동 PsimCarS)                                 │
│                                                           │
│  TOTAL.GDB ──→ gd_upload.py (3분마다 변경감지)            │
│                    │                                      │
│                    ├──→ SCP/SFTP → 서버 incoming/         │
│                    └──→ S3 (dreammechanic-gd-sync)        │
│                                                           │
│  gd_close_sync.py (마감 버튼) ──→ 즉시 업로드 + API 호출  │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ EC2 서버 (ubuntu@13.209.143.155)                          │
│                                                           │
│  /home/ubuntu/gd-sync/                                    │
│  ├── incoming/TOTAL.GDB          ← PC에서 수신            │
│  ├── slots/                                               │
│  │   ├── A/ (5개 FIFO)           ← 서비스 슬롯            │
│  │   ├── B/ (5개 FIFO)           ← 서비스 슬롯            │
│  │   └── C/ (5개 FIFO)           ← 격리 백업              │
│  ├── gd_sync_server.py           ← 메인 데몬              │
│  ├── config.json                 ← 활성 슬롯 상태         │
│  └── logs/                                                │
│                                                           │
│  PostgreSQL (Docker)                                      │
│  ├── GdVehicle   (slot='A'|'B')                          │
│  ├── GdRepair    (slot='A'|'B')                          │
│  ├── GdProduct   (slot='A'|'B')                          │
│  ├── GdSaleDetail(slot='A'|'B')                          │
│  ├── GdCustomer  (slot='A'|'B')                          │
│  └── GdSlotConfig(activeSlot, updatedAt)                 │
└──────────────────────────────────────────────────────────┘
```

---

## 2. A/B 시소 메커니즘

### 핵심 원칙
- **항상 1개 슬롯만 활성** (읽기 서비스)
- **비활성 슬롯에 새 데이터 기록** → 완료 후 활성 전환
- **전환은 원자적** (GdSlotConfig.activeSlot 1줄만 UPDATE)
- **실패 시 기존 슬롯 유지** (안전)

### 동작 흐름
```
[시작] 현재 활성: A
  │
  ├── 새 GDB 도착
  │   ├── B 슬롯의 기존 데이터 DELETE (slot='B')
  │   ├── GDB 파싱 → B 슬롯에 INSERT (slot='B')
  │   ├── 검증: B 행 수 체크 (최소 임계값)
  │   ├── ✅ 성공 → GdSlotConfig.activeSlot = 'B'
  │   └── ❌ 실패 → A 유지, 에러 로그
  │
  ├── 다음 GDB 도착
  │   ├── A 슬롯의 기존 데이터 DELETE (slot='A')
  │   ├── GDB 파싱 → A 슬롯에 INSERT (slot='A')
  │   ├── 검증 → 성공 시 activeSlot = 'A'
  │   └── ... 반복 (시소)
```

### 검증 규칙
- GdVehicle 최소 100건
- GdProduct 최소 50건
- GdSaleDetail 최소 1000건
- 임계값 미달 시 전환 거부 + 텔레그램 경고

---

## 3. C 격리 슬롯

### 목적
- **복원 원본**: A/B 모두 손상될 경우 C에서 복원
- **직접 서비스 안 함**: DB에 저장 안 함 (파일만)
- **5개 FIFO**: 가장 오래된 파일 자동 삭제

### 저장 구조
```
/home/ubuntu/gd-sync/slots/C/
├── 20260324_0830_TOTAL.GDB.gz    # 가장 오래된
├── 20260324_0900_TOTAL.GDB.gz
├── 20260324_0930_TOTAL.GDB.gz
├── 20260324_1000_TOTAL.GDB.gz
└── 20260324_1030_TOTAL.GDB.gz    # 최신
```

### 복원 절차 (수동)
1. C 슬롯에서 원하는 시점의 GDB 선택
2. incoming/에 복사
3. gd_sync_server.py가 자동 임포트
4. 비활성 슬롯에 기록 → 전환

---

## 4. DB 스키마 변경

### 4.1 slot 컬럼 추가 (5개 테이블)

| 테이블 | 추가 컬럼 | 추가 인덱스 |
|--------|-----------|------------|
| GdCustomer | `slot String @default("A")` | `@@index([slot])` |
| GdVehicle | `slot String @default("A")` | `@@index([slot])` |
| GdProduct | `slot String @default("A")` | `@@index([slot])` |
| GdSaleDetail | `slot String @default("A")` | `@@index([slot, saleDate])` |
| GdRepair | `slot String @default("A")` | `@@index([slot, vehicleCode])` |

### 4.2 GdSlotConfig 모델 (신규)

```prisma
model GdSlotConfig {
  id          Int      @id @default(1)
  activeSlot  String   @default("A")    // "A" | "B"
  lastSyncAt  DateTime?
  lastSyncSlot String?                  // 마지막으로 데이터 쓴 슬롯
  switchCount Int      @default(0)      // 전환 횟수 (모니터링)
  updatedAt   DateTime @updatedAt
}
```

### 4.3 기존 데이터 처리
- 마이그레이션 시 기존 모든 GD 데이터에 `slot='A'` 자동 설정
- GdSlotConfig 초기값: `activeSlot='A'`
- 즉, 마이그레이션 직후 A가 활성 → 기존 서비스 영향 없음

---

## 5. 서버 읽기 로직

### 현재 (변경 전)
```typescript
this.prisma.gdVehicle.findMany({ where: { ... } })
```

### 변경 후
```typescript
// 모든 GD 조회에 슬롯 필터 적용
const slot = await this.getActiveSlot();
this.prisma.gdVehicle.findMany({ where: { slot, ... } })
```

### getActiveSlot() 캐싱
- 매 요청마다 DB 조회 방지
- 인메모리 캐시 (30초 TTL)
- 슬롯 전환 시 캐시 무효화

---

## 6. 동기화 스케줄

### gd_sync_server.py (서버 데몬)
```
영업시간 (08:30~19:00 KST):
  - 30분마다 incoming/ 폴더 체크
  - 새 파일 있으면 → A/B 시소 임포트
  - C 슬롯에 파일 백업 (FIFO 5개)

영업외:
  - 1시간마다 체크 (마감 동기화 대비)
  - 새 파일 없으면 대기

마감 (수동):
  - PC에서 gd_close_sync.py 실행
  - 즉시 업로드 + 서버 API 호출
  - 서버가 즉시 임포트 실행
```

### gd_close_sync.py (PC 마감 프로그램)
```
바탕화면 아이콘 더블클릭
  → TOTAL.GDB 즉시 업로드 (SCP)
  → 서버 API 호출: POST /incentive/gd/trigger-sync
  → 서버 응답 대기 (최대 5분)
  → ✅ "동기화 완료!" 표시 (tkinter 팝업)
  → ❌ 실패 시 에러 메시지 표시
```

---

## 7. 백업 체계 (3단계)

### 7.1 실시간 (GDB 파일)
- A/B/C 슬롯 각 5개 = 최대 15개 GDB 파일
- S3: 5일치 (수명 규칙 이미 설정)

### 7.2 시간별 (PostgreSQL)
- **매 1시간**: pg_dump → gzip
- **24개 보관**: 25번째 도착 시 가장 오래된 것 삭제
- 위치: `/home/ubuntu/dreaming-mech/backups/hourly/`

### 7.3 일별 (PostgreSQL)
- **7일 FIFO**: 매일 자정에 최신 시간별 백업을 일별로 복사
- 위치: `/home/ubuntu/dreaming-mech/backups/daily/`

### 7.4 장기 (PostgreSQL)
- **새벽 2시**: pg_dump → gzip → 30일 보관
- 위치: `/home/ubuntu/dreaming-mech/backups/monthly/`
- 텔레그램 알림 (성공/실패)

---

## 8. 파일 목록 (구현 대상)

### 신규 생성
| 파일 | 위치 | 설명 |
|------|------|------|
| `gd_sync_server.py` | `scripts/gd-sync/` | 서버 데몬 (A/B 시소 + C 격리) |
| `gd_close_sync.py` | `scripts/gd-sync/` | PC 마감 프로그램 |
| `gd_close_sync.bat` | `scripts/gd-sync/` | Windows 바로가기용 |
| `requirements-server.txt` | `scripts/gd-sync/` | 서버 Python 의존성 |
| `test_seesaw.py` | `scripts/gd-sync/` | 시소 검증 테스트 |
| `migration.sql` | `prisma/migrations/` | slot 컬럼 + GdSlotConfig |

### 수정
| 파일 | 변경 내용 |
|------|-----------|
| `schema.prisma` | slot 컬럼 5개 + GdSlotConfig 모델 |
| `gd.service.ts` | getActiveSlot() + 모든 조회에 slot 필터 |
| `gd.controller.ts` | trigger-sync 엔드포인트 추가 |
| `backup.sh` | 3단계 백업 (시간별/일별/장기) |
| `incentive.module.ts` | 필요 시 새 서비스 등록 |

---

## 9. 안전 장치

### 전환 전 검증
- 행 수 최소 임계값 체크
- 전환 실패 시 기존 슬롯 유지
- 모든 전환 이력 GdSyncLog에 기록

### 복원 시나리오
| 상황 | 대응 |
|------|------|
| 동기화 실패 | 기존 활성 슬롯 유지, 에러 로그 |
| 데이터 손상 | C 슬롯에서 복원 |
| DB 전체 손상 | 시간별/일별 백업에서 복원 |
| 서버 장애 | S3 백업에서 GDB 복원 |

### 모니터링
- GdSyncLog: 모든 동기화 이력
- 텔레그램: 실패/경고 시 즉시 알림
- 생존 로그: 1시간마다 "[ALIVE]" 기록

---

## 10. 제약사항 & 주의

1. **Firebird 라이브러리**: 서버에 `fdb` + `libfbclient2` 설치 필요
2. **Prisma 마이그레이션**: 프로덕션 배포 시 `prisma migrate deploy` (migration_user)
3. **기존 데이터**: 마이그레이션 시 자동으로 slot='A' 배정
4. **PC 마감 프로그램**: 정비소 PC에 직접 설치 필요
5. **30분 주기 변경**: gd_upload.py의 INTERVAL 수정 (PC 방문 시)

---

*이 설계도는 구조 계약서입니다. 모든 코드 변경은 이 문서를 기준으로 합니다.*
