# /obsidian

$ARGUMENTS가 비어있으면 **반드시 briefing 모드를 실행**합니다. 인자가 있으면 해당 모드를 실행합니다.

## 연결 정보
- REST API: http://127.0.0.1:27123
- API Key: Bearer 0b0350be06da430e66f15c94dd9946958173c0c0b85bb438a91023b36c3017e3
- 볼트 경로 (Filesystem): /Users/shinjeayoun/Library/Mobile Documents/iCloud~md~obsidian/Documents/시작. 1/

## API 사용법

### 파일 읽기
```bash
curl -s -H "Authorization: Bearer $API_KEY" "http://127.0.0.1:27123/vault/{URL인코딩된경로}"
```
또는 Filesystem MCP: `mcp__filesystem__read_text_file` (볼트경로 + 파일경로)

### 파일 쓰기
```bash
curl -s -X PUT "http://127.0.0.1:27123/vault/{URL인코딩된경로}" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: text/markdown" \
  -d "{마크다운 내용}"
```

### 폴더 목록
```bash
curl -s -H "Authorization: Bearer $API_KEY" "http://127.0.0.1:27123/vault/{URL인코딩된폴더}/"
```

### 검색 (JsonLogic)
```bash
curl -s -X POST "http://127.0.0.1:27123/search/" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/vnd.olrapi.jsonlogic+json" \
  -d '{"in":["검색어",{"var":"content"}]}'
```
결과: `[{filename, result: true/false}]` — result가 true인 파일만 사용

## 폴더 구조 (허용 폴더)

| 폴더 | 용도 | 쓰기 가능 모드 |
|------|------|---------------|
| 01-Memory/ | 사용자 정보, 우선순위 | save |
| 03-Actions/ | 진행 중 작업 | save |
| 04-AI-Research/ | AI 조사 결과 | research, save |
| 05-Content/ | 콘텐츠 가이드/기획 | 읽기만 |
| 06-Templates/ | 템플릿 | 읽기만 |
| 📥 Inbox/ | 핸드폰 메모 (정리 대상) | 읽기만 (정리 결과는 다른 폴더에 저장) |
| 📋 정리됨/ | 정리 완료 노트 | tidy 결과 저장 |
| 📅 일정/ | 일정 노트 | tidy, sync |
| ✅ 할일/ | 할일 목록 | tidy |
| 🗄️ 완료/ | 완료된 파일 보관소 | briefing (대장님 완료 명령 시) |

## 모드

### briefing (기본 — $ARGUMENTS 비어있으면 이 모드)
**1원칙: "한 것 / 안 한 것" — 6개 데이터 소스를 종합하여 두 분류로 보고.**

#### 데이터 수집 (가능한 한 병렬 실행)

**소스 1: 옵시디언 볼트 (⚠️ 가장 중요 — 모든 파일 빠짐없이 읽을 것!)**

절대 규칙: **볼트의 모든 .md 파일을 하나도 빠짐없이 읽고, 하나도 빠짐없이 보고에 포함한다.** 파일을 생략하거나 요약하지 않는다. .canvas 파일만 무시.

실행 순서:
1. REST API GET /vault/ → 루트 .md 파일 목록 확인 → **각 파일 내용 전부 읽기**
2. 모든 하위 폴더 목록 조회: ✅ 할일, 03-Actions, 04-AI-Research, 05-Content, 📋 정리됨, 📅 일정, 01-Memory, 📥 Inbox, 06-Templates
3. **각 폴더의 모든 .md 파일 내용을 Bash REST API GET으로 하나씩 전부 읽기**
4. 하위 폴더 안에 또 폴더가 있으면 (예: 04-AI-Research/trends/) 그 안도 스캔
5. 파일이 50개든 100개든 **전부 읽는다. 건너뛰기 금지.**

**소스 2: 구글 캘린더**
1. `gcal_list_events` 호출 (timeMin: 오늘 00:00, timeMax: 내일 23:59, timeZone: Asia/Seoul)

**소스 3: 개발 프로젝트**
1. `tasks/todo.md` 읽기 (프로젝트 코드베이스 내)
2. MEMORY.md의 "현재 진행 중" 섹션 참조

**소스 4: Git 히스토리**
1. `git log --oneline -5` 실행

**소스 5: 서버 상태**
1. `curl -s -o /dev/null -w "%{http_code}" https://dreammechaniclab.com` (프론트엔드)
2. `curl -s -o /dev/null -w "%{http_code}" https://dreammechaniclab.com/api/health` (백엔드)

**소스 6: 📥 Inbox**
1. REST API GET /vault/%F0%9F%93%A5%20Inbox/ → .md 파일 개수 (사용법.md 제외)

#### 분류 원칙

**✅ 한 것 (완료 — 앞으로 필요 없는 것)**
판별 기준:
- `[x]` 체크된 항목
- `#완료` 태그가 있는 파일
- `completed:` frontmatter가 있는 파일
- `status: 완료` 파일
- 지나간 캘린더 일정 (액션 불필요)
- 완료된 git 커밋 (배포 완료)

→ **개수만 표시** (상세 나열 X). 끝난 건 끝난 것.

⚠️ **중요 규칙: "한 것"으로 분류하는 것은 대장님이 직접 "완료" 또는 "삭제" 명령했을 때만.** Claude가 자동으로 완료 처리하지 않는다.

**완료 처리 절차 (대장님 명령 시):**
1. 해당 파일에 `#완료` 태그 + `completed: YYYY-MM-DD` frontmatter 추가
2. 해당 파일을 `🗄️ 완료/` 폴더로 이동 (REST API: 원본 읽기 → 완료 폴더에 PUT → 원본 삭제는 대장님이 직접)
3. 브리핑에서는 "한 것" 개수에만 포함

**❌ 안 한 것 (앞으로 해야 할 모든 것)**
판별 기준:
- `[ ]` 미체크 항목
- `#진행중` 태그 파일
- 04-AI-Research/ 학습 자료 (아직 적용 안 한 것)
- 체크박스 없는 액션 메모
- 다가오는 캘린더 일정
- tasks/todo.md 미완료 항목
- 📥 Inbox 정리 안 된 메모

→ **소분류하여 상세 보고. 모든 파일이 반드시 어딘가에 등장해야 한다:**

| 소분류 | 포함 내용 |
|--------|-----------|
| 📅 일정 | 📅 일정/ 폴더 전체 + 캘린더 일정 |
| 🔴 긴급 | 오늘/내일 마감 할일 |
| 💻 개발 | tasks/todo.md 미완료, 진행중 프로젝트, 웹오류 등 |
| 🟡 프로젝트/사업 | 03-Actions/, ERP, SaaS, 사업 관련 메모 |
| 🎬 콘텐츠 | 유튜브 대본/촬영/기획, 05-Content/ 파일 |
| 📚 공부 | 04-AI-Research/ 전체, AI/기술 학습 메모 |
| 📋 정리/메모 | 📋 정리됨/ 전체, 📥 Inbox, 볼트 루트 메모, 기타 |
| ✅ 할일 | ✅ 할일/ 폴더 전체 |
| 🟢 개인 | 여행, 개인 일정/메모 |

⚠️ **검증: 보고서 작성 후, 읽은 파일 총 개수와 보고서에 등장한 파일 개수를 대조한다. 빠진 파일이 있으면 추가한다.**

#### 출력 규칙
⚠️ **모든 파일을 "제목 — 30자 내외 요약" 형식으로 한 줄씩 나열한다. 폴더 단위 요약 금지. 파일 하나하나 전부 보여줘야 한다.**

#### 출력 형식
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎖️ 대장님 종합 브리핑 — {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 서버: 프론트 ✅/❌ | 백엔드 ✅/❌
📊 볼트 현황: 총 {N}개 파일 스캔 완료

━━━ ✅ 한 것 (완료) ━━━
총 {N}건 (대장님 완료 처리한 항목만)

━━━ ❌ 안 한 것 ━━━

📅 일정
| 시간 | 일정 (캘린더) |
|------|------|
| {HH:MM} | {일정명} |

📅 일정/ ({N}개)
- 2026-03-29 제주도 여행 — 제주도 출발 일정
- 2026-04-05-세무사미팅 — 4/5 세무사 미팅 예정
- (... 모든 파일 나열)

🔴 긴급 (오늘/내일 마감)
- {파일명} — {30자 요약}

✅ 할일/ ({N}개)
- AI 학습 목록 — AI 도구 학습 체크리스트
- GT 타이어 영상 촬영 — GT타이어 촬영 준비사항
- (... 모든 파일 나열)

💻 개발
- {tasks/todo.md 미완료 항목 각각}
- {진행중 프로젝트}

🟡 03-Actions/ ({N}개)
- 커스텀 ERP — 극동 ERP 웹 전환 계획
- 오픈클로 전략 — AI 콘텐츠 자동화 전략
- (... 모든 파일 나열)

🎬 콘텐츠 (05-Content/ + 대본/기획 관련)
- guide — 글 구조 가이드
- 대본 - DPF 편 — DPF 관련 유튜브 대본
- (... 모든 파일 나열)

📚 04-AI-Research/ ({N}개)
- 전기차 정비 트렌드 — 전기차 시장 리서치
- 하네스 개념 — 하네스 AI 공부 정리
- (... 모든 파일 나열)

📋 정리됨/ ({N}개)
- 4월 유튜브 기획서 — 4월 촬영 계획
- SaaS 월구독 시스템 — 구독 모델 아이디어
- (... 28개 모든 파일 나열)

📁 볼트 루트 ({N}개)
- 병가 기준 — 병가 규정 만들기
- 아마존 데이터 관리 — S3 비용 절감 방안
- (... 모든 파일 나열)

📥 Inbox: {N}개 정리 대기

🟢 개인
- {여행/개인 관련 파일명} — {30자 요약}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
(해당 소분류에 항목이 없으면 그 소분류는 생략)

#### 실패 처리
- 개별 소스 데이터 수집 실패 시 해당 부분만 "⚠️ 수집 실패" 표시
- 나머지는 정상 출력 (전체 중단 X)

### memory
01-Memory/ 하위 5개 파일을 읽어서 핵심 내용 요약 보고:
- who-i-am.md, business-structure.md, tools-and-stack.md, current-priorities.md, todo-master.md

실행: Filesystem Read로 각 파일 읽기 → 핵심 내용 요약 보고

### search [키워드]
볼트 전체에서 키워드 검색.

실행 순서:
1. Bash로 REST API POST /search/ 호출 (JsonLogic: `{"in":["키워드",{"var":"content"}]}`)
2. 결과에서 `result: true`인 파일 목록 추출
3. 관련도 높은 파일 3~5개 내용을 Filesystem Read로 읽기
4. 핵심 내용 요약 보고

### save [폴더코드] [제목]
현재 대화 결과를 볼트에 저장.

폴더코드 매핑:
- memory → 01-Memory/
- actions → 03-Actions/
- research → 04-AI-Research/
- content → 05-Content/

파일명: `YYYY-MM-DD-{제목}.md`

파일 형식:
```markdown
---
tags: [{카테고리}]
date: YYYY-MM-DD
---
# {제목}

{내용}
```

실행: Bash로 REST API PUT 호출

### tidy (Inbox 정리)
📥 Inbox/의 모든 .md 파일을 읽고 분류.

실행 순서:
1. Bash로 REST API GET /vault/%F0%9F%93%A5%20Inbox/ 호출하여 파일 목록 조회
2. 각 파일 내용 읽기 (사용법.md 제외)
3. 내용 분석 후 카테고리 분류:
   - 날짜+시간+장소 → 📅 일정/YYYY-MM-DD-{제목}.md + 구글 캘린더 이벤트 생성
   - 할 일/해야 함/체크박스 → ✅ 할일/ 기존 파일에 추가 또는 새 파일
   - 사업/매출/고객/정비 → 📋 정리됨/{제목}.md
   - 유튜브/촬영/대본 → 📋 정리됨/{제목}.md
   - AI/기술/도구 → 04-AI-Research/{제목}.md
   - 기타 → 📋 정리됨/{제목}.md
4. 분류 결과 테이블 보고
5. REST API PUT으로 각 대상 폴더에 정리된 노트 저장
6. 원본은 삭제하지 않음 (사용자가 직접 삭제)
7. 정리된 노트에 `#정리완료` 태그 추가

저장 형식:
```markdown
---
tags: [정리완료, {카테고리}]
date: YYYY-MM-DD
source: 📥 Inbox/{원본파일명}
---
# {정리된 제목}

{정리된 내용}

---
> 원본: 📥 Inbox/{원본파일명}
```

### research [주제]
웹 조사 후 볼트에 저장.

실행 순서:
1. WebSearch로 주제 검색 (한국어 + 영어 각 1회)
2. 상위 결과 3~5개 URL에 WebFetch로 상세 수집
3. 조사 결과를 마크다운으로 정리
4. Bash로 REST API PUT → 04-AI-Research/YYYY-MM-DD-{주제}.md 저장
5. 핵심 발견 3줄 요약 보고

저장 형식:
```markdown
---
tags: [리서치, {주제태그}]
date: YYYY-MM-DD
status: 완료
---
# AI 스카우트 리포트: {주제}

## 핵심 트렌드
- {트렌드1}: {요약}
- {트렌드2}: {요약}

## 콘텐츠 소재
- {소재1}: {유튜브/블로그 활용 아이디어}

## 액션 아이템
- [ ] {실행 항목}

## 참고 출처
- [{제목}]({URL})
```

### guide
05-Content/ 하위 가이드 파일 3개를 읽어서 콘텐츠 작성 규칙 로드:
- guide.md (글 구조)
- writing-style.md (문체)
- content-calendar.md (소재 관리)

실행: Filesystem Read → 콘텐츠 작성 컨텍스트 주입

### sync (일정 동기화)
📅 일정/ 노트 ↔ 구글 캘린더 동기화.

실행 순서:
1. Bash로 REST API GET /vault/%F0%9F%93%85%20%EC%9D%BC%EC%A0%95/ 호출
2. 각 일정 파일 읽기 (날짜, 시간, 제목 추출)
3. gcal_list_events로 해당 기간 구글 캘린더 이벤트 조회
4. 비교 결과 보고:
   - 볼트에만 있는 일정 → 캘린더에 추가할지 확인
   - 캘린더에만 있는 일정 → 볼트에 노트 생성할지 확인
5. 사용자 확인 후 동기화 실행

## 자연어 트리거
사용자가 /obsidian 없이 말해도 아래 패턴 감지 시 해당 모드 실행:
- "브리핑" / "옵시디안 브리핑" / "모든 내역 브리핑" / "전체 보고" / "현재상황 보고" / "할일 전체 보여줘" → briefing 모드
- "옵시디언에 저장" / "볼트에 저장" → save 모드
- "Inbox 정리" / "메모 정리" → tidy 모드
- "~~ 조사해서 저장" / "~~ 리서치해줘" → research 모드
- "옵시디언에서 ~~ 찾아" → search 모드

## 규칙
- 허용 폴더 밖의 파일은 절대 수정/삭제하지 않음
- Inbox 메모 원본은 보존 (사용자가 직접 삭제)
- 파일명은 한국어 OK, 날짜 포맷: YYYY-MM-DD
- 정리된 노트에는 #정리완료 태그 추가
- REST API 실패 시 Filesystem MCP로 폴백
- REST API가 안 되면 "옵시디언 앱을 켜주세요" 안내

## 사용 예시
```
/obsidian                           # 전체 브리핑 (기본 — 실행한것/안한것 분류)
/obsidian memory                    # 메모리 로드
/obsidian briefing                  # 전체 브리핑 (위와 동일)
/obsidian search 타이어              # 볼트에서 타이어 관련 검색
/obsidian save research 트렌드리포트  # 04-AI-Research/에 저장
/obsidian tidy                      # Inbox 정리
/obsidian research 전기차 정비        # 웹 조사 + 저장
/obsidian guide                     # 콘텐츠 가이드 로드
/obsidian sync                      # 일정 동기화
```
