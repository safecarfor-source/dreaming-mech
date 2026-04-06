# AI 썸네일 생성 도구 — 시스템 설계도

> 최종 갱신: 2026-04-07 | 상태: Phase 1+3 배포 완료

## 1. 개요

꿈꾸는정비사 유튜브 채널(52K 구독자)의 **미리캔버스를 대체하는 AI 썸네일 생성 도구**.
기존 `/yt/` 유튜브 서포터의 ThumbnailTab에서 동작하며, AI 전략 수립 → 이미지 생성 → 캔버스 편집 → 전문가 학습 메모리를 하나의 앱에서 완결한다.

---

## 2. 시스템 아키텍처

```
┌─ Frontend ──────────────────────────────────────────────┐
│                                                          │
│  ThumbnailTab.tsx (3개 뷰)                               │
│  ├─ CreateView: 전략 생성 → 이미지 생성 → 미리보기       │
│  ├─ GalleryView: 생성된 썸네일 목록/피드백               │
│  └─ LearnView: 이미지 분석 | 노하우 입력 | 학습 목록     │
│                                                          │
│  api.ts: 9개 API 함수 + 2개 타입 정의                    │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP (axios)
┌──────────────────────▼───────────────────────────────────┐
│  Backend (NestJS)                                         │
│                                                           │
│  Controller: 9개 엔드포인트 (@UseGuards YtAuthGuard)      │
│       │                                                   │
│  YouTubeSupporterService (9개 썸네일 메서드)               │
│       │                                                   │
│  ┌────┼──────────────────────────────────────────┐       │
│  │    ├─ AiOrchestrationService                  │       │
│  │    │   ├─ generateThumbnailStrategy()         │       │
│  │    │   │   → Claude Sonnet 4.5               │       │
│  │    │   └─ analyzeThumbnailImage()             │       │
│  │    │       → Claude Vision (Sonnet 4.5)      │       │
│  │    │                                           │       │
│  │    └─ ReplicateService (실제: OpenAI DALL-E 3) │       │
│  │        └─ generateImage()                     │       │
│  │            → OpenAI API (dall-e-3)            │       │
│  └───────────────────────────────────────────────┘       │
│                                                           │
│  Database (Prisma + PostgreSQL)                           │
│  ├─ YtThumbnail: 썸네일 레코드                            │
│  ├─ YtSkillNote (category='thumbnail'): 학습 메모리       │
│  └─ YtProject: 프로젝트 연결 (FK, onDelete: Cascade)      │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 3. 외부 API

| API | 모델 | 용도 | 건당 비용 |
|-----|------|------|----------|
| OpenAI | DALL-E 3 (HD) | 배경 이미지 생성 | ~$0.08 |
| Anthropic | Claude Sonnet 4.5 | 전략 생성 + 프롬프트 변환 | ~$0.02 |
| Anthropic | Claude Sonnet 4.5 (Vision) | 레퍼런스 썸네일 분석 | ~$0.01 |

환경변수: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (둘 다 서버 `.env`에 설정됨)

---

## 4. API 엔드포인트 (9개)

모든 엔드포인트: `@UseGuards(YtAuthGuard)` 보호

### 4.1 전략/생성

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `/yt/thumbnail/strategy` | AI 전략 3안 생성 | `{projectId?, customInstruction?}` | `{strategies: ThumbnailStrategy[]}` |
| POST | `/yt/thumbnail/generate` | DALL-E 3 이미지 생성 | `{projectId?, prompt, width?, height?}` | `{id, imageUrls: string[], status}` |

### 4.2 저장/조회/삭제

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `/yt/thumbnail/save` | 완성 썸네일 저장 | `{projectId?, imageUrl, baseImageUrl?, canvasData?, strategy?, prompt?}` | `YtThumbnail` |
| GET | `/yt/thumbnail/list` | 썸네일 목록 | `?projectId=` (query) | `YtThumbnail[]` |
| DELETE | `/yt/thumbnail/:id` | 썸네일 삭제 | - | - |

### 4.3 학습/메모리

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `/yt/thumbnail/analyze` | 레퍼런스 분석 (Vision) | `FormData {image, userNote?, saveToMemory?}` | 분석 JSON |
| POST | `/yt/thumbnail/feedback` | 좋아요/별로 평가 | `{thumbnailId, rating: 'good'|'bad', comment?}` | `YtSkillNote` |
| POST | `/yt/thumbnail/memory` | 노하우 직접 입력 | `{content, tags?}` | `YtSkillNote` |
| GET | `/yt/thumbnail/memory` | 학습 메모리 조회 | - | `YtSkillNote[]` |

---

## 5. 데이터 모델

### 5.1 YtThumbnail

```prisma
model YtThumbnail {
  id           String     @id @default(uuid())
  projectId    String?                         // 프로젝트 연결 (선택)
  project      YtProject? @relation(onDelete: Cascade)
  imageUrl     String?                         // 완성 PNG URL
  baseImageUrl String?                         // 배경 이미지 URL (AI or 실사진)
  canvasData   Json?                           // Konva JSON (편집 상태)
  strategy     Json?                           // 선택된 AI 전략
  prompt       String?    @db.Text             // 이미지 생성 프롬프트
  status       String     @default("DRAFT")    // DRAFT | GENERATING | COMPLETED
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([projectId])
  @@index([createdAt])
}
```

### 5.2 학습 메모리 (YtSkillNote 활용)

```
category = 'thumbnail'
source = 'thumbnail-analyzer' | 'expert-input' | 'feedback'
tags = ['ai-analysis', 'expert-rule', 'feedback', 감정톤, 구도유형 등]
```

---

## 6. AI 전략 생성 프롬프트 설계

### 입력

```
프로젝트 제목 + 코어벨류 + 대본 요약 (productionData에서)
+ 학습된 노하우 최근 20개 (YtSkillNote, category='thumbnail')
+ 사용자 커스텀 지시 (선택)
```

### 출력 (JSON)

```json
{
  "strategies": [
    {
      "concept": "긴급 경고형",
      "description": "한줄 설명",
      "background": "배경 이미지 설명",
      "textMain": "6자 이내 메인 텍스트",
      "textSub": "보조 텍스트 (선택)",
      "colorScheme": {
        "background": "배경 색감",
        "textColor": "#FFD700",
        "accentColor": "#FF0000"
      },
      "emotionalTone": "긴급",
      "fluxPrompt": "YouTube thumbnail, 1280x720, ... (영문)"
    }
  ]
}
```

### 플라이휠 구조

```
학습 0개  →  일반적 유튜브 지식만 사용
학습 5개  →  채널 스타일 패턴 잡히기 시작
학습 20개 →  자동차 정비 + 고유 스타일 각인
학습 50개 →  지시 없이도 최적 전략 자동 생성
```

---

## 7. 프론트엔드 구조

### 현재 (단일 파일)

```
ThumbnailTab.tsx (685줄)
├─ CreateView     — STEP 1: 전략 → STEP 2: 이미지 생성 → STEP 3: 미리보기
├─ GalleryView    — 목록, 호버 액션 (좋아요/별로/삭제)
├─ LearnView      — 3개 서브탭 (분석/입력/목록)
└─ DirectUploadSection — Phase 2 안내 플레이스홀더
```

### 미래 (분리 예정)

```
ThumbnailTab.tsx                 — 탭 오케스트레이션
thumbnail/
  StrategyPanel.tsx              — AI 전략 카드 UI
  ImageGenerator.tsx             — DALL-E 생성 + 프롬프트 편집
  CanvasEditor.tsx               — react-konva (Phase 2)
  TextOverlay.tsx                — 텍스트 스타일 패널 (Phase 2)
  ReferenceAnalyzer.tsx          — 이미지 분석 + 노하우 입력
  ThumbnailGallery.tsx           — 갤러리 + 피드백
```

---

## 8. 현재 구현 상태

### ✅ 완료 (배포됨)

| 기능 | 설명 |
|------|------|
| AI 전략 생성 | Claude Sonnet → 3안 JSON 반환, 학습 데이터 자동 주입 |
| AI 이미지 생성 | DALL-E 3 HD (1792x1024) → URL 반환 |
| 전략 카드 UI | 3개 카드, 컬러 미리보기, 선택 후 프롬프트 편집 가능 |
| 프롬프트 편집 | 영문 프롬프트 직접 수정 후 재생성 |
| 이미지 미리보기 | 생성 이미지 + 텍스트 오버레이 미리보기 |
| 갤러리 | 프로젝트별 목록, 상태 뱃지, 날짜 표시 |
| 피드백 | 좋아요/별로 → YtSkillNote에 저장 |
| 이미지 분석 | Claude Vision → 구조화 JSON + 자동 메모리 저장 |
| 노하우 입력 | 텍스트 + 태그 → YtSkillNote에 저장 |
| 학습 목록 | 소스별 뱃지 (전문가/피드백/AI분석), 태그 표시 |

### ⏳ 미구현 (Phase 2~4)

| 기능 | Phase | 설명 |
|------|-------|------|
| 캔버스 편집기 | 2 | react-konva, 텍스트 드래그, 한글 폰트 |
| 실사진 업로드 | 2 | 배경으로 직접 사진 설정 |
| PNG 내보내기 | 2 | 1280x720 캔버스→이미지 변환 |
| 캔버스 저장/복원 | 2 | canvasData JSON 저장 & 불러오기 |
| S3 업로드 (완성 이미지) | 2 | canvas-to-image → S3 저장 |
| 배경 제거 | 4 | remove.bg API 연동 |
| 프리셋 템플릿 | 4 | 자동차 정비 특화 레이아웃 |
| A/B 비교 | 4 | 2개 썸네일 나란히 비교 |

---

## 9. 발전 로드맵

### Phase 2: 캔버스 편집기 (다음 구현)

**목표:** 이미지 위에 한글 텍스트를 배치하여 완성 썸네일을 만드는 편집기

**기술:**
- `react-konva` + `konva` (SSR 비활성화: `next/dynamic`, `ssr: false`)
- 한글 웹폰트 3종: Black Han Sans, Noto Sans KR Bold, Jua

**기능:**
- 1280x720 고정 캔버스
- 배경: AI 이미지 자동 로드 또는 실사진 드래그앤드롭 업로드
- 텍스트 추가: 내용, 폰트, 크기(20~200px), 색상, 테두리(stroke), 그림자
- 드래그로 자유 배치
- PNG 내보내기 (canvas.toDataURL → 다운로드 + S3 업로드)
- canvasData JSON 저장 → 나중에 다시 열어서 편집

**신규 API:**
- `POST /yt/thumbnail/upload-final` — canvas PNG를 S3에 업로드

**필수 선행 작업:**
- DALL-E 생성 이미지 → 즉시 S3 복사 (URL 만료 ~1시간 대응)
- `generateThumbnailImage()` 완료 시 status를 'COMPLETED'로 업데이트
- 파일 업로드 MIME 검증 + 크기 제한 (10MB) 추가

**한글 폰트:**
- `FontFace` API로 명시적 로드 후 캔버스 렌더링 (Konva 폰트 로딩 주의)

**YAGNI:** 도형, 레이어 패널, 크롭/회전, 필터, 벡터 편집

### Phase 3: 학습 시스템 고도화 — 기본 배포 완료, 아래 고도화 미구현

**배포됨:** 이미지 분석, 노하우 입력, 피드백, 학습 목록, 전략 생성 시 자동 주입

**미구현 (고도화):**
- 학습 항목 편집/삭제 기능
- 태그 기반 필터링
- 학습 데이터 통계 (유형별 분포, 최근 활동)
- 전략 생성 시 "이 노하우를 반영했습니다" 표시

### Phase 4: 고도화 (선택)

- **배경 제거**: remove.bg API → 인물 사진에서 배경 분리
- **프리셋 템플릿**: 자동차 정비 채널 특화 레이아웃 3-5종
- **A/B 비교**: 2개 썸네일 나란히 놓고 비교
- **CTR 예측**: 학습 데이터 기반 예상 클릭률 표시
- **FLUX 전환**: Replicate API로 FLUX 1.1 Pro 지원 (더 높은 실사 품질)

---

## 10. 핵심 파일 맵

### Backend

| 파일 | 역할 | 라인 |
|------|------|------|
| `prisma/schema.prisma` | YtThumbnail 모델 | 1028-1042 |
| `youtube-supporter/services/replicate.service.ts` | DALL-E 3 래퍼 | 전체 |
| `youtube-supporter/services/ai-orchestration.service.ts` | 전략 생성 + Vision 분석 | 835-955 |
| `youtube-supporter/youtube-supporter.service.ts` | 비즈니스 로직 9개 메서드 | 1182-1370 |
| `youtube-supporter/youtube-supporter.controller.ts` | 9개 엔드포인트 | 655-768 |
| `youtube-supporter/schemas/youtube-supporter.schema.ts` | 6개 Zod 스키마 | 173-218 |
| `youtube-supporter/youtube-supporter.module.ts` | ReplicateService 등록 | 6, 16 |

### Frontend

| 파일 | 역할 |
|------|------|
| `app/yt/components/tabs/ThumbnailTab.tsx` | 통합 UI (685줄) |
| `app/yt/lib/api.ts` | 9개 API 함수 + 타입 (495-596) |
| `app/yt/projects/[id]/page.tsx` | ThumbnailTab 마운트 (270) |

---

## 11. 에러 처리

| 상황 | 처리 방식 |
|------|----------|
| DALL-E 3 생성 실패 | throw → NestJS 예외 필터 → 500 응답 |
| Claude 전략 JSON 파싱 실패 | `{ raw: rawResponse }` 폴백 반환 |
| Vision 분석 결과 파싱 실패 | 메모리 저장 스킵 + 경고 로그 |
| 분석 이미지 미첨부 | `BadRequestException` → 400 응답 |
| 피드백 대상 썸네일 없음 | `NotFoundException` → 404 응답 |
| API 키 미설정 | Mock 모드 (플레이스홀더 이미지/더미 JSON 반환) |

---

## 12. 알려진 이슈

| 이슈 | 심각도 | 설명 |
|------|--------|------|
| DALL-E URL 만료 | **높음** | 생성된 이미지 URL이 ~1시간 후 만료됨. Phase 2에서 S3 복사 필수 |
| status 미갱신 | 중간 | `generateThumbnailImage()`에서 DB status='GENERATING' 유지. 갤러리 뱃지 영향 |
| 이미지 MIME 미검증 | 중간 | analyze 엔드포인트에서 파일 타입/크기 검증 없음 |
| fluxPrompt 레거시 네이밍 | 낮음 | 코드/프롬프트에 FLUX 참조 남아있음 (실제는 DALL-E 3 사용) |
| AI 엔드포인트 Rate Limit 없음 | 낮음 | 유료 API 호출에 일일 한도 없음 (단일 사용자라 위험 낮음) |
| DALL-E 사이즈 제약 | 정보 | 1280x720 요청 → 실제 1792x1024 생성 |
| ThumbnailTab 단일 파일 | 정보 | 668줄, Phase 2에서 컴포넌트 분리 예정 |

---

## 13. 인증

모든 썸네일 엔드포인트는 `@UseGuards(YtAuthGuard)` 보호.
- Frontend: `localStorage`의 `yt_auth_token` → 요청 헤더 `x-yt-token`으로 자동 전송
- Backend: `YtAuthGuard`가 헤더의 토큰 검증
- 단일 사용자 도구 (멀티 테넌트 아님)
