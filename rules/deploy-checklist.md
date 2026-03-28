# 배포 후 체크리스트

배포 완료 후 반드시 아래 항목을 순서대로 확인한다.
프론트엔드 수정 시에도 동일하게 적용.

---

## 필수 체크 (매 배포마다)

### 1. 로그인
- [ ] dreammechaniclab.com 접속
- [ ] 정비소 계정으로 로그인 성공 확인

### 2. 차량검색 → 상세페이지
- [ ] 메인에서 차량번호 검색
- [ ] 상세페이지 진입 확인
- [ ] 품목명 2줄 표시 정상 여부
- [ ] 날짜 / 금액 / 주행거리 표시 정상 여부

### 3. 타이어 검색
- [ ] 타이어 카테고리 검색 동작 확인
- [ ] 검색 결과 목록 정상 출력

### 4. 인센티브 페이지
- [ ] dreammechaniclab.com/incentive 접속
- [ ] 업로드 현황 (극동 데이터 최신 여부) 확인
- [ ] 월별 인센티브 수치 표시 정상 여부

### 5. 컨테이너 상태
```bash
ssh -i "/Users/shinjeayoun/Documents/문서/dreaming-mech-key.pem" ubuntu@13.209.143.155 \
  "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```
- [ ] 3개 컨테이너 모두 healthy

---

## 인센티브 페이지 수정 시 추가 체크

- [ ] 인센티브 수치 계산값 이전과 동일한지 확인
- [ ] 업로드 → 결과 반영 흐름 확인
- [ ] 팀/개인 인센티브 페이지 각각 확인

---

## 이상 발생 시

1. 백엔드 로그 확인
```bash
docker logs dreaming-mech-backend 2>&1 | tail -30
```
2. Migration 오류 → `rules/db-safety.md` 참조
3. 컨테이너 다운 → postgres 먼저 기동 후 backend 순서로 재시작
