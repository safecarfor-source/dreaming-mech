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

## 모드

### briefing (기본 — $ARGUMENTS 비어있으면 이 모드)
옵시디언 볼트 전체를 읽고 **실행 한 것 / 실행 안 한 것**으로 분류하여 종합 보고.

실행 순서:
1. 모든 폴더 목록 조회 (볼트 루트(무제), ✅ 할일, 03-Actions, 04-AI-Research, 05-Content, 📋 정리됨, 📅 일정, 01-Memory)
2. 각 폴더의 모든 파일 내용을 Bash REST API GET으로 읽기
3. 2가지 대분류로 정리:

**✅ 실행 한 것 (완료):**
- `[x]` 체크된 항목
- `#완료` 태그가 있는 파일
- `completed:` frontmatter가 있는 파일
- `status: 완료` 파일

**❌ 실행 안 한 것 (미완료):**
- `[ ]` 미체크 항목
- `#진행중` 태그 파일
- 04-AI-Research/ 학습 자료 (아직 적용 안 한 것)
- 체크박스 없는 액션 메모

4. 실행 안 한 것 내부 소분류:
   - 🔴 긴급 (오늘/내일 마감)
   - 🟠 이번 주
   - 🟡 진행 중 프로젝트 (코드/시스템)
   - 🟡 유튜브 촬영/콘텐츠
   - 🔵 프로젝트/사업 (장기)
   - 🟣 학습/자기개발 (04-AI-Research 전체 포함)
   - 🟢 여행/개인
   - 📅 다가오는 일정 (액션 필요한 것)

5. 아래 형식으로 보고:

```
## 활용중 / 진행중
| # | 파일명 | 요약 |
|---|--------|------|

## 📝 작업 필요
| # | 파일명 | 요약 |
|---|--------|------|

## 📋 참고자료 / 아이디어
| # | 파일명 | 요약 |
|---|--------|------|

## ✅ 완료
| # | 파일명 | 완료일 |
|---|--------|--------|
```

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
- "옵시디안 브리핑" / "모든 내역 브리핑" / "전체 보고" / "할일 전체 보여줘" → briefing 모드
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
