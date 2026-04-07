# /wiki

Karpathy LLM Wiki 시스템. $ARGUMENTS의 첫 단어로 모드 결정. 비어있으면 status 모드.

## 연결 정보 (옵시디언과 동일)
- REST API: http://127.0.0.1:27123
- API Key: Bearer 0b0350be06da430e66f15c94dd9946958173c0c0b85bb438a91023b36c3017e3
- 볼트 경로: /Users/shinjeayoun/Library/Mobile Documents/iCloud~md~obsidian/Documents/시작. 1/

## 위키 폴더 구조
```
10-wiki-raw/              원본 소스 저장소
├── _index.md             인제스트 목록 (자동 유지)
├── articles/             웹 클립, 기사
├── papers/               논문, 기술 문서
├── videos/               유튜브 트랜스크립트
├── repos/                GitHub README, 코드 분석
└── notes/                대장님 수동 메모, 경험 지식

11-wiki/                  컴파일된 위키
├── _index.md             마스터 인덱스 (자동 유지)
├── _schema.md            위키 규칙 (읽기 전용)
├── _health.md            린트 결과
├── 정비기술/             자동차 정비 기술 지식
├── 유튜브/               YouTube 콘텐츠 제작
├── AI활용/               AI/LLM 활용법
├── 비즈니스/             비즈니스/SaaS
└── QA/                   Q&A 결과물
```

## 페이지 유형 & Frontmatter

### raw (10-wiki-raw/{type}/)
```yaml
---
type: raw
title: "소스 제목"
source_url: "https://..."
source_type: article | paper | video | repo | note
ingested: YYYY-MM-DD
language: ko | en
tags: [태그1, 태그2]
compiled: false
---
```

### concept (11-wiki/{topic}/)
```yaml
---
type: concept
title: "개념 제목"
topic: 정비기술 | 유튜브 | AI활용 | 비즈니스
sources:
  - "[[10-wiki-raw/articles/소스1]]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: high | medium | low
tags: [태그1, 태그2]
---
```

### qa (11-wiki/QA/)
```yaml
---
type: qa
question: "원래 질문"
topic: 정비기술 | 유튜브 | AI활용 | 비즈니스
created: YYYY-MM-DD
sources_used:
  - "[[11-wiki/정비기술/개념1]]"
tags: [태그1]
---
```

## 모드

### status (기본 — $ARGUMENTS 비어있으면)

위키 현황 요약 보고.

실행:
1. REST API GET /vault/10-wiki-raw/ → 하위 폴더별 .md 파일 수 집계
2. REST API GET /vault/11-wiki/ → 하위 토픽별 .md 파일 수 집계
3. 10-wiki-raw/_index.md 읽기 → `compiled: false` 개수 확인

출력:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 LLM Wiki 현황 — {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📥 Raw 소스: {N}개
  articles: {N} | papers: {N} | videos: {N} | repos: {N} | notes: {N}
  미컴파일: {N}개

📖 Wiki 문서: {N}개
  정비기술: {N} | 유튜브: {N} | AI활용: {N} | 비즈니스: {N} | QA: {N}

최근 활동:
- {최근 인제스트/컴파일 기록 3개}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### ingest (인제스트)

$ARGUMENTS에서 모드 이후 부분을 입력으로 받는다.

패턴:
- `/wiki ingest https://...` → URL 인제스트 (article)
- `/wiki ingest youtube https://youtube.com/...` → YouTube 인제스트 (video)
- `/wiki ingest note 내용내용내용` → 수동 메모 인제스트 (note)
- `/wiki ingest paper https://...` → 논문 인제스트 (paper)

#### URL 인제스트 (article/paper) 절차

1. **WebFetch**로 URL 내용 수집
2. **제목 추출**: 페이지 제목 또는 LLM이 핵심 제목 생성 (한국어)
3. **3줄 요약** 생성 (본문 최상단에 배치)
4. **태그 추출**: 내용에서 관련 태그 3~5개 자동 추출
5. **토픽 추정**: 정비기술/유튜브/AI활용/비즈니스 중 가장 관련도 높은 것
6. **파일명 생성**: `YYYY-MM-DD-{kebab-제목}.md` (한국어 OK)
7. **저장**: REST API PUT → `10-wiki-raw/articles/{파일명}` (또는 papers/)
   ```bash
   curl -s -X PUT "http://127.0.0.1:27123/vault/10-wiki-raw/articles/{URL인코딩된파일명}" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: text/markdown" \
     -d "{마크다운 내용}"
   ```
8. **인덱스 갱신**: `10-wiki-raw/_index.md` 테이블에 새 행 추가
   - 기존 _index.md 읽기 → 테이블 끝에 행 추가 → PUT으로 덮어쓰기
9. **보고**: `인제스트 완료: {제목} → 10-wiki-raw/{type}/{파일명}`

⚠️ 저작권 주의: 원본 전체를 복사하지 않는다. **3줄 요약 + 핵심 포인트 추출 + 출처 URL**로 저장한다. 원문을 그대로 옮기지 않는다.

#### YouTube 인제스트 절차
1. **WebFetch**로 YouTube 페이지에서 제목, 설명, 채널명 수집
2. 트랜스크립트가 있으면 핵심 내용 추출 (전체 복사 X)
3. 나머지는 article과 동일

#### 수동 메모 인제스트 (note) 절차
1. $ARGUMENTS에서 "note" 이후 텍스트를 내용으로 사용
2. LLM이 제목 생성
3. `10-wiki-raw/notes/{파일명}`에 저장
4. 나머지 동일

---

### compile (컴파일)

미컴파일 raw 소스를 위키 개념 페이지로 변환.

패턴:
- `/wiki compile` → 미컴파일 raw 전체 처리 (최대 5개씩)
- `/wiki compile 파일명` → 특정 raw만 컴파일
- `/wiki compile topic 정비기술` → 해당 토픽 전체 재컴파일

#### 기본 컴파일 절차

1. **raw 스캔**: `10-wiki-raw/_index.md` 읽기 → `compiled: false` 항목 추출 (최대 5개)
2. **각 raw 파일 읽기**: REST API GET으로 내용 로드
3. **기존 위키 인덱스 로드**: 해당 토픽 `_index.md` 읽기
4. **판단** (각 raw별):
   - 기존 개념 페이지와 **같은 주제**인가? → **병합** (기존 페이지 보강)
   - **새로운 주제**인가? → **신규 생성**
5. **개념 페이지 작성/갱신**:

   **신규 생성 시 템플릿:**
   ```markdown
   ---
   type: concept
   title: "{개념 제목}"
   topic: {토픽}
   sources:
     - "[[10-wiki-raw/{type}/{파일명}]]"
   created: YYYY-MM-DD
   updated: YYYY-MM-DD
   confidence: {high|medium|low}
   tags: [{태그들}]
   ---
   # {개념 제목}

   ## 핵심 요약
   {3~5줄 핵심 내용}

   ## 상세 내용
   {체계적으로 정리된 설명}

   ## 관련 개념
   - [[다른-개념-페이지]] — {왜 관련되는지 한 줄}

   ## 실전 적용
   {대장님 정비소에서 어떻게 활용할 수 있는지}
   {유튜브 콘텐츠로 어떻게 만들 수 있는지}

   ## 출처
   - [[10-wiki-raw/{type}/{파일명}]] — {소스 한줄 설명}
   ```

   **병합 시:**
   - 기존 페이지 읽기
   - 새 정보를 적절한 섹션에 추가
   - `sources` frontmatter에 새 소스 추가
   - `updated` 날짜 갱신
   - `confidence` 재평가

6. **교차 링크 생성**:
   - 같은 토픽 내 관련 문서 `[[]]` 링크
   - 다른 토픽이라도 태그가 겹치면 `관련 개념`에 추가
7. **raw 마킹**: 컴파일 완료된 raw 파일의 frontmatter `compiled: true` 로 변경
8. **인덱스 재생성**: 변경된 토픽의 `_index.md` + 마스터 `11-wiki/_index.md` 갱신

   **토픽 _index.md 형식:**
   ```markdown
   ---
   type: index
   scope: topic
   updated: YYYY-MM-DD
   ---
   # {토픽명} 위키

   ## 개요
   {이 토픽에 대한 2줄 설명}

   ## 문서 목록
   | 문서 | 요약 | 신뢰도 | 최종수정 |
   |------|------|--------|----------|
   | [[개념1]] | 한줄요약 | high | 2026-04-07 |
   | [[개념2]] | 한줄요약 | medium | 2026-04-07 |

   ## 아직 없는 주제
   - {이 토픽에서 다뤄야 할 주제인데 아직 문서가 없는 것}
   ```

   **마스터 _index.md 형식:**
   ```markdown
   ---
   type: index
   scope: master
   updated: YYYY-MM-DD
   ---
   # 꿈꾸는정비사 LLM Wiki

   ## 현황
   - Raw 소스: {N}개 (미컴파일: {N}개)
   - Wiki 문서: {N}개
   - QA: {N}개

   ## 토픽별 문서
   ### 정비기술 ({N}개)
   | 문서 | 요약 |
   |------|------|
   | [[정비기술/개념1]] | 한줄요약 |

   ### 유튜브 ({N}개)
   ...

   ### AI활용 ({N}개)
   ...

   ### 비즈니스 ({N}개)
   ...

   ## 최근 변경
   - YYYY-MM-DD: {변경 내용}
   ```

9. **보고**:
   ```
   컴파일 완료:
   - ✅ 신규: {문서명} (정비기술/)
   - ✅ 보강: {문서명} ← 새 소스 1개 반영
   - 📋 인덱스 갱신: 정비기술/_index.md, _index.md
   - 📊 잔여 미컴파일: {N}개
   ```

---

### query (질의)

위키 기반 Q&A. $ARGUMENTS에서 "query" 이후 전체를 질문으로 취급.

#### 절차

1. **질문 분석**: 핵심 키워드 2~3개 추출
2. **1차 검색 — 인덱스 스캔**:
   - `11-wiki/_index.md` 읽기
   - 관련 토픽 `_index.md` 읽기
   - 문서 목록에서 관련 후보 선정
3. **2차 검색 — REST API 키워드 검색**:
   ```bash
   curl -s -X POST "http://127.0.0.1:27123/search/" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/vnd.olrapi.jsonlogic+json" \
     -d '{"in":["키워드",{"var":"content"}]}'
   ```
   결과에서 `11-wiki/` 경로 파일만 필터링
4. **3차 — 문서 전문 읽기**: 관련도 높은 3~7개 문서 내용 읽기
5. **답변 생성**:
   - 위키 문서 내용 기반 체계적 답변
   - 참조한 위키 문서 명시: `📚 참조: [[문서1]], [[문서2]]`
   - 위키에 없는 내용은 `⚠️ 위키 미수록 정보` 표시
6. **파일링 제안**: 답변이 새로운 지식을 포함하면
   - `💾 이 답변을 위키에 저장할까요? (/wiki file)`
7. **빈틈 감지**: 답변 과정에서 위키에 없어야 할 정보 발견 시
   - `📭 위키 빈틈: {주제}에 대한 문서가 없습니다`

출력 형식:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 Wiki Q&A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: {질문}

A: {답변}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 참조: [[문서1]], [[문서2]], [[문서3]]
⚠️ 위키 미수록: {있다면}
💾 파일링 제안: {있다면}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### lint (건강검진)

위키 전체 품질 검사. 자동으로 `11-wiki/_health.md`에 결과 저장.

#### 검사 항목

| 검사 | 설명 | 심각도 |
|------|------|--------|
| 고아 raw | `compiled: false` 상태 7일+ 방치 | 🟡 경고 |
| 깨진 링크 | `[[]]` 가 가리키는 파일 미존재 | 🔴 오류 |
| 소스 없는 개념 | concept인데 sources 비어있음 | 🟡 경고 |
| 오래된 문서 | updated가 90일+ 지남 | 🔵 정보 |
| 토픽 불균형 | 특정 토픽만 문서 과다/과소 | 🔵 정보 |
| 중복 의심 | 제목/태그 매우 유사한 문서 쌍 | 🟡 경고 |
| 인덱스 불일치 | _index.md 기록 vs 실제 파일 수 다름 | 🔴 오류 |
| 흥미로운 연결 | 다른 토픽인데 태그 겹치는 문서 쌍 | 💡 제안 |

#### 절차

1. **전체 스캔**: `10-wiki-raw/` + `11-wiki/` 하위 모든 `.md` 파일 목록 수집
2. **frontmatter 파싱**: 각 파일의 type, sources, tags, updated, compiled 추출
3. **규칙 검증**: 위 검사 항목 순회
4. **연결 분석**: wikilink 추출 → 대상 파일 존재 여부 확인
5. **빈틈 발견**: 태그 분석으로 문서 부족한 영역 추론
6. **결과 저장**: `11-wiki/_health.md`에 저장
7. **터미널 출력**

출력:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 위키 건강검진 — {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 현황: raw {N}개 | wiki {N}개 | QA {N}개

🔴 오류 ({N}건)
- {오류 상세}

🟡 경고 ({N}건)
- {경고 상세}

🔵 정보 ({N}건)
- {정보 상세}

💡 제안 ({N}건)
- {제안 상세}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### file (파일링)

직전 대화의 좋은 답변/지식을 위키에 저장.

#### 절차

1. **대화 분석**: 직전 대화에서 저장 가치 있는 내용 추출
2. **유형 판단**:
   - 질문+답변 형태 → QA 페이지 (`11-wiki/QA/`)
   - 새로운 개념/지식 → concept 페이지 (`11-wiki/{topic}/`)
   - 대장님 경험 지식 → raw/notes에 먼저 인제스트 후 컴파일 제안
3. **중복 확인**: 위키에 유사한 문서 있는지 REST API 검색
   - 있으면: "기존 {문서명}에 보강 vs 새로 생성?" 확인
   - 없으면: 새 파일 생성
4. **저장**: REST API PUT
5. **인덱스 갱신**: 해당 `_index.md` 업데이트
6. **보고**: `파일링 완료: {파일명} → {경로}`

QA 페이지 템플릿:
```markdown
---
type: qa
question: "{질문}"
topic: {관련 토픽}
created: YYYY-MM-DD
sources_used:
  - "[[참조한 위키 문서]]"
tags: [{태그들}]
---
# Q: {질문}

## A:
{답변 내용}

## 참조
- [[위키 문서1]] — 이 부분 참고
```

---

## 규칙

### 필수
- 모든 파일은 YAML frontmatter 필수
- 내부 링크는 `[[]]` wikilink 형식만 사용
- 파일명: `YYYY-MM-DD-{kebab-제목}.md` (raw) 또는 `{kebab-제목}.md` (wiki)
- 태그: 소문자, 공백 대신 하이픈 (한국어 OK)
- concept 페이지에 `실전 적용` 섹션 필수
- `_index.md`는 자동 생성 — 수동 편집해도 다음 compile/lint에서 덮어씀

### 금지
- 원본 웹페이지 전체 복사 금지 (저작권) → 요약+핵심추출+출처URL만
- `_schema.md` 수정 금지
- 11-wiki/ 안에서 수동으로 파일 삭제 금지 (lint로 관리)

### REST API 패턴
```bash
# 읽기
curl -s -H "Authorization: Bearer 0b0350be06da430e66f15c94dd9946958173c0c0b85bb438a91023b36c3017e3" \
  "http://127.0.0.1:27123/vault/{URL인코딩경로}"

# 쓰기
curl -s -X PUT "http://127.0.0.1:27123/vault/{URL인코딩경로}" \
  -H "Authorization: Bearer 0b0350be06da430e66f15c94dd9946958173c0c0b85bb438a91023b36c3017e3" \
  -H "Content-Type: text/markdown" \
  -d "{마크다운 내용}"

# 폴더 목록
curl -s -H "Authorization: Bearer 0b0350be06da430e66f15c94dd9946958173c0c0b85bb438a91023b36c3017e3" \
  "http://127.0.0.1:27123/vault/{URL인코딩폴더}/"

# 검색
curl -s -X POST "http://127.0.0.1:27123/search/" \
  -H "Authorization: Bearer 0b0350be06da430e66f15c94dd9946958173c0c0b85bb438a91023b36c3017e3" \
  -H "Content-Type: application/vnd.olrapi.jsonlogic+json" \
  -d '{"in":["키워드",{"var":"content"}]}'
```

REST API 실패 시 → Filesystem Read/Write로 볼트 경로 직접 접근 (폴백)
REST API가 아예 안 되면 → "옵시디언 앱을 켜주세요" 안내

## 사용 예시
```
/wiki                                          # 현황 보고
/wiki ingest https://example.com/article       # URL 인제스트
/wiki ingest youtube https://youtu.be/abc      # YouTube 인제스트
/wiki ingest note DPF 재생 시 배기온도 600도...  # 메모 인제스트
/wiki compile                                  # 미컴파일 전체 처리
/wiki compile topic 정비기술                    # 정비기술 토픽 재컴파일
/wiki query DPF 재생 실패 원인이 뭐야?           # 위키 Q&A
/wiki lint                                     # 건강검진
/wiki file                                     # 직전 대화를 위키에 저장
```
