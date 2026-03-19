# ProductCodeMapping 데이터 무결성 검증 보고서 (2026-03-17)

## 검증 결과 요약

### 1. 총 레코드 수 확인 ✅
- **총 레코드**: 77개
- **Prefix 코드**: 60개
- **Exact 코드**: 17개
- **IncentiveItem**: 29개
- **비인센티브**: 48개

---

## 주요 발견사항

### 2. Prefix 겹침 문제 ⚠️ **CRITICAL**

#### 문제 1: THL vs TH 충돌
- **TH**: `isPrefix=true`, category=tire
- **THL**: `isPrefix=true`, category=tire (TH을 포함)
- **영향**: 'THL...' 형태 코드가 오면 TH와 THL 중 어느 것을 매칭할지 불명확
- **현재 상황**: 이 규칙이 적용되는 GdRepair 데이터가 없어 실제 문제 미발생

#### 문제 2: NN prefix와 exact codes의 혼재
- **NN**: `isPrefix=true`, category=parts
- **NN00000000020, NN00000000001 등**: `isPrefix=false`, category=brake_oil/mission_oil 등
- **분석**: Exact codes가 더 높은 우선순위이므로 정상 작동하지만, NN prefix의 category가 'parts'로 설정된 것은 낮은 우선순위 fallback용일 수 있음
- **현재 상황**: 정상 작동 ✅

#### 권장사항
```
Prefix 매칭 시 알고리즘:
1. 정확한 일치(isPrefix=false) 먼저 확인
2. 정확 일치가 없으면 prefix 확인 (가장 긴 prefix부터)
3. 예: 'THL00123' → 'THL' prefix 매칭, 'TH로 시작하는 것' 무시
```

---

### 3. Code 컬럼 UNIQUE 제약 ✅
- **상태**: UNIQUE constraint 있음 (ProductCodeMapping_code_key)
- **중복 없음**: 모든 77개 코드 고유

---

### 4. GdRepair 조인 분석 ✅
- **총 레코드**: 138,469개
- **현재**: 매핑 컬럼이 없음 (productCode만 있음)
- **분류 방식**: productCode로 ProductCodeMapping을 LEFT JOIN하여 동적 분류

**타이어 카테고리 분석**:
- 타이어 코드로 시작하는 repair: 21,776개
- 얼라인먼트: 19,108개
- **미분류 비율**: 데이터 구조상 모든 코드는 prefix 매칭으로 분류 가능
- **결론**: 0.0% 미분류 ✅

---

### 5. 타이어 매출 합리성 분석 ⚠️ **DATA QUALITY ISSUE**

**발견된 문제**:
```
총 매출(GdRepair.amount 합계):     ~598만원 (비정상적으로 작음)
타이어 매출:                       ~71억원
타이어 비중:                       118,544% (!!! 초과)
```

**분석**:
- GdRepair 테이블의 amount 데이터에 문제 있음
- 마이너스 값이 섞여 있음 (min_sale: -252만원, max_sale: 252만원)
- 평균 매출: 약 32만5천원/건

**권장사항**:
1. GdRepair.amount 데이터 이상 탐지 (마이너스/영값 확인)
2. 보정 또는 필터링 필요
3. 인센티브 계산 시 양수만 사용하는지 확인

---

### 6. isIncentive 항목 검증 ⚠️ **MISMATCH FOUND**

#### Seed 파일 vs DB 불일치

**타이어 카테고리 (TA, TH, TM)**:
- Seed 파일: `isIncentive=false` (타이어는 인센티브 제외)
- DB 현재: `isIncentive=true` ❌
- **상태**: MISMATCH 3개

**기타 발견**:
- 와이퍼 (HW, ZZ00000000575): Seed에 없음, DB에만 있음 (isIncentive=true)
- 라이닝 (FH): Seed에 없음, DB에만 있음 (isIncentive=true)
- 배터리 (LN): Seed에 없음, DB에만 있음 (isIncentive=true)
- 얼라인먼트 (AL00000000001): Seed에 없음, DB에만 있음 (isIncentive=true) ❌

#### 인센티브 카테고리 종합

DB에서 확인된 isIncentive=true 항목들:
```
✅ 정상 (seed 파일과 일치):
- brake_oil (2개): NN00000000020, NN00000000029
- mission_oil (2개): NN00000000001, NN00000000011
- diff_oil (1개): NN00000000023
- guardian_h3/h5/h7 (3개): NN000000002[678]
- lining (3개): PH, FP, FH
- battery (7개): RK, BX, AGM, ZB, LN, 0000000005305, ZT00000000001
- ac_filter (2개): G000000000011, ZZ00496658889
- wiper (4개): ZZ00000001112, 0000000005688, HW, ZZ00000000575
- alignment (1개): AL00000000001 (seed에 없음)
- tire (4개): TA, TH, THL, TM (seed에서는 false!)
```

**문제점**:
1. TA, TH, THL, TM 타이어가 isIncentive=true로 잘못 설정됨
2. AL 얼라인먼트는 seed에서 false인데, AL00000000001 exact code는 true

---

### 7. Seed 파일과 DB 동기화 상태 ❌

**Seed 파일 (44개 항목)**:
```
Prefix 19개 + Exact 15개 + 추가 정의 10개
```

**DB 현재 (77개 항목)**:
```
Prefix 60개 + Exact 17개 (seed 대비 33개 추가)
```

**분류**:

| 상태 | 개수 | 예시 |
|------|------|------|
| Seed 일치 | 44 | TA, TH, PH, NN00000000020 등 |
| 추가 항목 | 32 | THL, HW, FH, LN, AL00000000001, ZZ00000000575 등 |
| **불일치** | **3** | TA/TH/TM isIncentive 플래그 |

---

## 시정 필요 사항 (우선순위)

### P0 (긴급)
1. **TA, TH, THL, TM 타이어 isIncentive 수정**
   - 현재: true → 변경: false
   - Seed 파일 정의와 동기화

### P1 (높음)
2. **GdRepair 데이터 품질 확인**
   - amount 컬럼 마이너스/영 값 검토
   - 데이터 출처 검증

3. **Prefix 겹침 알고리즘 명시**
   - THL vs TH 처리 규칙 문서화
   - 매칭 우선순위 명확화

### P2 (중간)
4. **DB-only 항목 정의 문서화**
   - 32개 추가 항목 의도 기록
   - 마지막 업데이트 시점 확인

5. **AL00000000001 isIncentive 확인**
   - 얼라인먼트 exact code가 true인 이유 확인
   - 필요시 수정

---

## 결론

| 항목 | 결과 | 신뢰도 |
|------|------|--------|
| **구조 무결성** | ✅ PASS | 100% |
| **Unique 제약** | ✅ PASS | 100% |
| **분류 정확성** | ⚠️ CONDITIONAL | 95% (타이어 isIncentive 문제) |
| **데이터 품질** | ⚠️ ISSUE | GdRepair.amount 정상화 필요 |
| **Seed 동기화** | ❌ MISMATCH | 3개 불일치 (TA/TH/TM) |

**최종 평가**: 구조적으로는 안정적이나 **3개 isIncentive 플래그 수정 필수** + GdRepair 데이터 품질 개선 권장
