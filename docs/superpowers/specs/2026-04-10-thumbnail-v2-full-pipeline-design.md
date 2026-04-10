# AI 썸네일 V2 — 풀 파이프라인 설계도

> 최종 갱신: 2026-04-10 | 상태: 설계 완료, 구현 대기
> 이전 스펙: `2026-04-07-thumbnail-generator-design.md`

## 1. 개요

### 1.1 문제

현재 썸네일 시스템(V1)의 두 가지 핵심 불만:

1. **이미지 품질** — DALL-E 3는 "그림체"가 남아 실사 느낌이 안 남 (실사 설득력 62%)
2. **텍스트 가독성** — SVG 기반 시스템 폰트 한계로 한국 유튜브 썸네일 특유의 강렬한 타이포 표현 부족

### 1.2 목표

커리어해커 알렉스(Autokliq) 수준의 썸네일 품질 달성:
- **납득가는 실사 이미지** (AI 생성이지만 자연스러운 화질)
- **강렬한 한글 텍스트** (한눈에 읽히는 가독성)
- **대장님 얼굴 반영** (전략에 따라 인물 포함 시 실제 닮은 모습)
- **피드백 루프** (생성 → 리뷰 → 수정 → 반복)

### 1.3 레퍼런스

커리어해커 알렉스 워크플로우 분석 (2026-04-10):
- Discord + OpenClaw 기반 멀티 에이전트 오케스트레이션
- 얼굴 트레이닝 모듈 (정면/측면/표정 사진 → LoRA/PuLID 학습)
- Face Swap 기능으로 생성 이미지에 본인 얼굴 반영
- 피드백 루프 ("닮지 않았는데" → 재생성 → 확인 → 반복)
- Harness Engineering 언급 — 에이전트 자율 루프 구조

---

## 2. 시스템 아키텍처

```
┌─ Frontend ─────────────────────────────────────────────────┐
│                                                             │
│  ThumbnailTab (리팩토링)                                     │
│  ├─ CreateView: 전략 → 이미지 생성 → 얼굴 합성 → 미리보기   │
│  ├─ CanvasEditor: react-konva 텍스트 편집기 (신규)           │
│  ├─ FeedbackLoop: 변형 재생성 UI (강화)                      │
│  ├─ GalleryView: 히스토리 + 피드백                           │
│  └─ LearnView: 기존 유지                                    │
│  └─ FaceManager: 대장님 사진 업로드/관리 (신규)              │
│                                                             │
└──────────────────────┬─────────────────────────────────────┘
                       │ HTTP (axios)
┌──────────────────────▼─────────────────────────────────────┐
│  Backend (NestJS)                                           │
│                                                             │
│  ┌─ ImageEngineService (신규) ─────────────────────┐       │
│  │  ├─ GPT Image 1.5 (OpenAI API)                  │       │
│  │  │   → 인물 중심, 복잡 장면                       │       │
│  │  ├─ FLUX 2 Pro (fal.ai API)                      │       │
│  │  │   → 사물/차량 실사, 제품샷                     │       │
│  │  └─ 엔진 자동 선택 (Claude 전략에서 판단)          │       │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─ FaceCompositeService (신규) ───────────────────┐       │
│  │  ├─ fal.ai PuLID Flux API                        │       │
│  │  ├─ 레퍼런스 사진 관리 (S3 private)               │       │
│  │  └─ 인물 포함 전략 시 자동 합성                    │       │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─ ThumbnailComposerService (업그레이드) ─────────┐       │
│  │  ├─ 프로 한글 폰트 번들 (3종)                     │       │
│  │  ├─ 다중 텍스트 효과 (외곽선+그림자+글로우)        │       │
│  │  └─ PNG 출력 (기본 합성용)                        │       │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─ VariationService (신규) ───────────────────────┐       │
│  │  ├─ 변형 프롬프트 자동 생성 (Claude)              │       │
│  │  ├─ 히스토리 기반 컨텍스트 유지                    │       │
│  │  └─ 엔진 간 교차 생성                             │       │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
│  기존 서비스 (유지)                                          │
│  ├─ AiOrchestrationService: 전략 생성 + Vision 분석         │
│  ├─ YouTubeSupporterService: 비즈니스 로직                  │
│  └─ Database (Prisma + PostgreSQL)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 외부 API (변경)

| API | 모델 | 용도 | 건당 비용 | 비고 |
|-----|------|------|----------|------|
| OpenAI | GPT Image 1.5 (HD) | 인물 중심 이미지 생성 | $0.03~0.13 | 기존 키 재활용 |
| fal.ai | FLUX 2 Pro | 사물/차량 실사 이미지 | ~$0.03/MP | **신규 키 필요** |
| fal.ai | PuLID Flux | 얼굴 합성 | ~$0.02 | **신규** |
| Anthropic | Claude Sonnet 4.5 | 전략 생성 + 프롬프트 변환 | ~$0.02 | 기존 |
| Anthropic | Claude Sonnet 4.5 (Vision) | 레퍼런스 분석 | ~$0.01 | 기존 |
| ~~OpenAI~~ | ~~DALL-E 3~~ | ~~배경 이미지~~ | ~~$0.08~~ | **제거** |

환경변수 추가: `FAL_AI_API_KEY`

---

## 4. 신규/변경 API 엔드포인트

### 4.1 이미지 생성 (변경)

| HTTP | 경로 | 설명 | 변경사항 |
|------|------|------|---------|
| POST | `/yt/thumbnail/generate-complete` | 완성 썸네일 생성 (전략+이미지+얼굴+텍스트) | **신규** — 기존 개별 호출 통합 |
| POST | `/yt/thumbnail/generate-variation` | 변형 재생성 | **강화** — 히스토리 컨텍스트 추가 |
| GET | `/yt/thumbnail/job/:jobId` | 생성 진행 상태 | 기존 유지 |

### 4.2 얼굴 관리 (신규)

| HTTP | 경로 | 설명 | Request |
|------|------|------|---------|
| POST | `/yt/thumbnail/face/upload` | 레퍼런스 사진 업로드 | `FormData {images[]}` |
| GET | `/yt/thumbnail/face/list` | 등록된 사진 목록 | - |
| DELETE | `/yt/thumbnail/face/:id` | 사진 삭제 | - |

### 4.3 캔버스 (신규)

| HTTP | 경로 | 설명 | Request |
|------|------|------|---------|
| POST | `/yt/thumbnail/canvas/export` | 캔버스 PNG → S3 업로드 | `{canvasData, thumbnailId}` |

---

## 5. 데이터 모델 변경

### 5.1 YtThumbnail (확장)

```prisma
model YtThumbnail {
  // 기존 필드 유지
  id           String     @id @default(uuid())
  projectId    String?
  imageUrl     String?
  baseImageUrl String?
  canvasData   Json?
  strategy     Json?
  prompt       String?    @db.Text
  status       String     @default("DRAFT")
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // 신규 필드
  engine       String?    // 'gpt-image-1.5' | 'flux-2-pro'
  hasFace      Boolean    @default(false)  // 얼굴 합성 여부
  parentId     String?    // 변형 원본 ID (피드백 루프 추적)
  variationOf  String?    // 변형 타입 ('more_clickbait', 'face_closer' 등)
  finalUrl     String?    // 캔버스 편집 후 최종 PNG URL

  @@index([projectId])
  @@index([createdAt])
  @@index([parentId])
}
```

### 5.2 YtFaceReference (신규)

```prisma
model YtFaceReference {
  id        String   @id @default(uuid())
  imageUrl  String   // S3 private URL
  label     String?  // '정면', '측면', '작업복' 등
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([isActive])
}
```

---

## 6. 핵심 서비스 설계

### 6.1 ImageEngineService (신규)

단일 인터페이스로 두 엔진을 추상화.

```typescript
interface ImageGenerationRequest {
  prompt: string;
  engine: 'gpt-image-1.5' | 'flux-2-pro' | 'auto';
  width?: number;   // default 1280
  height?: number;  // default 720
  quality?: 'low' | 'medium' | 'high';  // GPT Image 전용
}

interface ImageGenerationResult {
  imageUrl: string;
  engine: string;
  cost: number;
  metadata: Record<string, unknown>;
}
```

**엔진 자동 선택 로직 (engine='auto'):**
- 전략의 `background` 필드에 "인물", "사람", "정비사" 포함 → GPT Image 1.5
- 전략의 `background` 필드에 "차량", "엔진", "부품", "공구" 포함 → FLUX 2 Pro
- 판단 불가 → GPT Image 1.5 (기본값)

### 6.2 FaceCompositeService (신규)

```typescript
interface FaceCompositeRequest {
  baseImageUrl: string;      // 생성된 배경 이미지
  prompt: string;            // 인물 설명 프롬프트
  referenceImageUrls: string[]; // 대장님 레퍼런스 사진들
}

interface FaceCompositeResult {
  imageUrl: string;
  similarity: number;  // 0~1 유사도 (PuLID 반환값)
}
```

**동작:**
1. S3에서 활성 레퍼런스 사진 URL 조회
2. fal.ai PuLID Flux API 호출 (레퍼런스 + 프롬프트)
3. 결과 이미지 S3 저장 후 URL 반환

### 6.3 VariationService (신규)

```typescript
interface VariationRequest {
  thumbnailId: string;       // 원본 썸네일 ID
  variation: string;         // 변형 타입
  customInstruction?: string; // "얼굴 더 크게 해줘" 같은 자유 입력
}
```

**변형 프롬프트 생성 로직:**
1. 원본 썸네일의 전략 + 프롬프트 조회
2. 변형 타입에 따른 수정 지시 생성 (Claude)
3. 수정된 프롬프트로 이미지 재생성
4. parentId에 원본 ID 기록 (히스토리 추적)

### 6.4 ThumbnailComposerService (업그레이드)

**변경 사항:**
- Docker 이미지에 한글 폰트 3종 번들:
  - `Black Han Sans` (두꺼운 제목용)
  - `Noto Sans KR Black` (보조 텍스트용)
  - `Jua` (친근한 톤용)
- 텍스트 효과 다중 레이어:
  - Layer 1: 그림자 (blur 12px, offset 4px, opacity 0.8)
  - Layer 2: 외곽선 (stroke 12px, round join)
  - Layer 3: 글로우 (blur 20px, accent color, opacity 0.4)
  - Layer 4: 본문 텍스트
- 폰트 선택: 전략의 `emotionalTone`에 따라 자동 배정
  - 긴급/경고 → Black Han Sans
  - 교육/정보 → Noto Sans KR Black
  - 친근/브이로그 → Jua

---

## 7. 프론트엔드 구조 (변경)

### 7.1 파일 구조

```
frontend/app/yt/components/tabs/thumbnail/
  ThumbnailTab.tsx           — 탭 오케스트레이션 (기존, 리팩토링)
  CreateView.tsx             — 전략 + 생성 UI (기존, 수정)
  CanvasEditor.tsx           — react-konva 텍스트 편집기 (신규 구현)
  GalleryView.tsx            — 갤러리 (기존, 유지)
  LearnView.tsx              — 학습 (기존, 유지)
  FaceManager.tsx            — 얼굴 사진 관리 UI (신규)
  VariationPanel.tsx         — 변형 재생성 패널 (신규)
  types.ts                   — 타입 정의 (확장)
```

### 7.2 CanvasEditor 핵심 기능

- 1280x720 고정 캔버스
- 배경: 생성된 이미지 자동 로드
- 텍스트 레이어: 추가/수정/삭제/드래그 이동
- 폰트 선택: 3종 (Black Han Sans, Noto Sans KR Black, Jua)
- 크기: 슬라이더 (20~200px)
- 색상: 프리셋 팔레트 + 커스텀
- 외곽선/그림자: 토글 + 강도 조절
- PNG 내보내기: canvas.toDataURL → S3 업로드
- FontFace API로 폰트 명시적 로드 후 렌더링

### 7.3 FaceManager

- 사진 업로드 (최대 20장, 각 10MB 이하)
- 레이블 지정 (정면/측면/작업복/표정 등)
- 미리보기 그리드
- 활성/비활성 토글
- 1회 설정 후 이후 자동 사용

---

## 8. 완성 파이프라인 (엔드투엔드)

```
사용자: "브레이크오일 교체 위험성" 제목 입력 + "긴급/경고" 스타일 선택

  → Step 1: Claude 전략 3안 생성
    전략 A: "경고형" — 메인: "이거 안하면" / 서브: "브레이크가 안 밟힌다" / 엔진: FLUX
    전략 B: "교육형" — 메인: "꼭 교체하세요" / 서브: "정비사가 알려드립니다" / 엔진: GPT
    전략 C: "호기심형" — 메인: "이 소리 나면?" / 서브: "즉시 정비소 가세요" / 엔진: FLUX

  → Step 2: 이미지 생성 (3안 병렬)
    A: FLUX 2 Pro → 브레이크 디스크 클로즈업 실사
    B: GPT Image 1.5 → 정비사가 브레이크 살펴보는 장면
    C: FLUX 2 Pro → 마모된 브레이크 패드 실사

  → Step 3: 얼굴 합성 (전략 B만 — 인물 포함)
    PuLID → 대장님 레퍼런스 + "정비사가 브레이크를 살펴보는" 프롬프트
    → 대장님 닮은 인물이 자연스럽게 반영된 이미지

  → Step 4: 텍스트 합성 (3안 모두)
    프로 폰트 + 다중 효과 → 서버에서 기본 합성

  → Step 5: 결과 카드 3장 표시
    대장님 확인 → "B가 좋은데 얼굴 좀 더 크게" → 변형 재생성
    → 수정된 B' 생성 → "OK 이걸로" → 캔버스 편집기에서 텍스트 위치 미세조정
    → PNG 내보내기 → 완성
```

---

## 9. 구현 순서 (5 Step)

### Step 1: 이미지 엔진 교체 (3일)

**작업:**
- `ImageEngineService` 신규 생성
- GPT Image 1.5 연동 (OpenAI API, 기존 키)
- FLUX 2 Pro 연동 (fal.ai API, 새 키)
- 엔진 자동 선택 로직
- 기존 `ReplicateService` (DALL-E 3) → `ImageEngineService`로 교체
- S3 즉시 복사 (URL 만료 대응)

**검증:**
- 같은 프롬프트로 DALL-E 3 vs GPT Image 1.5 vs FLUX 2 Pro 비교
- 실사 품질 육안 확인

**배포 후 효과:** 즉시 실사급 이미지 생성 가능

### Step 2: 텍스트 품질 업그레이드 (2일)

**작업:**
- Dockerfile에 한글 폰트 3종 번들 추가
- `ThumbnailComposerService` SVG 텍스트 효과 다중 레이어화
- 폰트 자동 선택 로직 (emotionalTone 기반)
- 하네스 상수 유지 (MIN_MAIN_FONT 140px 등)

**검증:**
- 동일 텍스트로 V1 vs V2 텍스트 렌더링 비교
- 모바일 크기에서 가독성 확인

**배포 후 효과:** 텍스트 가독성 대폭 향상

### Step 3: 얼굴 학습 + PuLID 연동 (3일)

**작업:**
- `YtFaceReference` Prisma 모델 추가 + 마이그레이션
- `FaceCompositeService` 신규 생성
- fal.ai PuLID Flux API 연동
- S3 private 버킷에 레퍼런스 사진 저장
- 프론트엔드 `FaceManager.tsx` 신규
- 얼굴 업로드/관리 API 3개 추가

**검증:**
- 대장님 사진 업로드 → PuLID 합성 → 유사도 확인
- 다양한 포즈/의상 프롬프트 테스트

**배포 후 효과:** 대장님 얼굴이 반영된 썸네일 생성 가능

### Step 4: 피드백 루프 강화 (2일)

**작업:**
- `VariationService` 신규 생성
- `YtThumbnail` 모델에 `parentId`, `variationOf`, `engine` 필드 추가
- 변형 옵션 확장 (8종)
- 자유 텍스트 입력 변형 ("얼굴 더 크게 해줘")
- Claude 기반 프롬프트 자동 수정
- 프론트엔드 `VariationPanel.tsx` 신규

**검증:**
- 원본 → 변형 → 재변형 체인 테스트
- 히스토리 추적 확인

**배포 후 효과:** "수정해줘" → 자동 재생성 루프 완성

### Step 5: 캔버스 편집기 (3일)

**작업:**
- `react-konva` + `konva` 설치 (SSR 비활성화)
- `CanvasEditor.tsx` 구현
- FontFace API 폰트 로딩
- 텍스트 레이어 CRUD + 드래그
- PNG 내보내기 → S3 업로드
- `/yt/thumbnail/canvas/export` API

**검증:**
- 배경 이미지 위 텍스트 배치 + 내보내기
- 다운로드된 PNG 1280x720 확인
- 한글 폰트 렌더링 확인

**배포 후 효과:** 텍스트 위치/스타일 미세조정 가능 → 풀 파이프라인 완성

---

## 10. 에러 처리

| 상황 | 처리 방식 |
|------|----------|
| GPT Image 1.5 실패 | FLUX 2 Pro로 폴백 (또는 반대) |
| fal.ai PuLID 실패 | 얼굴 합성 스킵, 기본 이미지만 반환 + 경고 |
| 레퍼런스 사진 없음 | PuLID 스킵, 일반 인물 생성 |
| fal.ai API 키 미설정 | GPT Image 1.5만 사용 (단일 엔진 모드) |
| 캔버스 폰트 로딩 실패 | 시스템 폰트 폴백 + 경고 표시 |
| S3 업로드 실패 | 로컬 base64 임시 저장 + 재시도 안내 |

---

## 11. 비용 분석

| 시나리오 | V1 (현재) | V2 (변경) |
|----------|----------|----------|
| 썸네일 3안 생성 (이미지만) | $0.24 (DALL-E 3 ×3) | $0.09~0.39 (엔진별) |
| + 얼굴 합성 (1안) | 불가 | +$0.02 |
| + 전략 생성 | $0.02 | $0.02 |
| + 변형 재생성 (1회) | $0.08 | $0.03~0.13 |
| **일반 세션 (3안 + 변형 1회)** | **~$0.34** | **~$0.20~0.55** |

월간 추정 (주 2회 × 4주 = 8세션): $1.6~4.4/월

---

## 12. 필수 선행 작업

| 항목 | 담당 | 설명 |
|------|------|------|
| fal.ai 가입 + API 키 발급 | 대장님 | https://fal.ai → 가입 → API Key |
| `.env`에 `FAL_AI_API_KEY` 추가 | 소위 | 로컬 + 서버 |
| 대장님 사진 10~20장 준비 | 대장님 | 정면/측면/작업복/다양한 표정 |
| S3 버킷 설정 확인 | 소위 | private 접근 정책 |

---

## 13. YAGNI (안 하는 것)

- 영상 생성 (Higgsfield 등) — 썸네일에 집중
- 실시간 협업 편집 — 단일 사용자
- A/B CTR 테스트 — 아직 데이터 부족
- 배경 제거 (remove.bg) — PuLID가 인물 포함 이미지 자체를 생성
- Midjourney 연동 — API 접근 제한적, 비용 비효율
- LoRA 직접 훈련 — PuLID로 충분, 훈련 인프라 불필요

---

## 14. 핵심 파일 맵 (변경 후)

### Backend (신규)

| 파일 | 역할 |
|------|------|
| `services/image-engine.service.ts` | GPT Image 1.5 + FLUX 2 Pro 듀얼 엔진 |
| `services/face-composite.service.ts` | fal.ai PuLID 얼굴 합성 |
| `services/variation.service.ts` | 변형 재생성 + 히스토리 |

### Backend (수정)

| 파일 | 변경 |
|------|------|
| `services/thumbnail-composer.service.ts` | 폰트 번들 + 다중 효과 |
| `services/replicate.service.ts` | → `image-engine.service.ts`로 대체 |
| `youtube-supporter.service.ts` | 새 서비스 연동 |
| `youtube-supporter.controller.ts` | 신규 엔드포인트 추가 |
| `schemas/youtube-supporter.schema.ts` | 신규 스키마 추가 |
| `youtube-supporter.module.ts` | 새 서비스 등록 |

### Frontend (신규)

| 파일 | 역할 |
|------|------|
| `thumbnail/CanvasEditor.tsx` | react-konva 편집기 (구현) |
| `thumbnail/FaceManager.tsx` | 얼굴 사진 관리 |
| `thumbnail/VariationPanel.tsx` | 변형 재생성 UI |

### Frontend (수정)

| 파일 | 변경 |
|------|------|
| `thumbnail/CreateView.tsx` | 엔진 선택 표시, 얼굴 합성 상태 |
| `thumbnail/types.ts` | 신규 타입 추가 |
| `lib/api.ts` | 신규 API 함수 추가 |

---

## 15. 알려진 제약/위험

| 위험 | 심각도 | 대응 |
|------|--------|------|
| PuLID 유사도가 낮을 수 있음 | 중간 | 레퍼런스 사진 수/품질로 보완, 유사도 낮으면 재시도 |
| fal.ai 서비스 장애 | 낮음 | GPT Image 1.5 단일 엔진 폴백 모드 |
| 한글 폰트 Docker 번들 크기 | 낮음 | 3종만 (약 15MB 추가) |
| react-konva SSR 이슈 | 낮음 | next/dynamic ssr:false로 해결 (검증됨) |
| 캔버스 편집기 모바일 UX | 정보 | 데스크톱 우선, 모바일은 기본 합성만 |
