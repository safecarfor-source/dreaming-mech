# 썸네일 V2 풀 파이프라인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DALL-E 3 기반 썸네일 시스템을 듀얼 엔진(GPT Image + FLUX 2 Pro) + PuLID 얼굴 합성 + 텍스트 품질 업그레이드로 교체하여 실사급 품질 달성

**Architecture:** 기존 ReplicateService(DALL-E 3)를 ImageEngineService로 교체. fal.ai API 추가로 FLUX 2 Pro + PuLID 연동. ThumbnailComposerService의 폰트/효과 업그레이드. 기존 CanvasEditor(510줄, react-konva)와 generate-complete/variation 엔드포인트는 이미 구현되어 있어 수정만 필요.

**Tech Stack:** NestJS 11, OpenAI API (gpt-image-1), fal.ai API (FLUX 2 Pro, PuLID Flux), sharp, react-konva (기설치), Prisma, S3

**Spec:** `docs/superpowers/specs/2026-04-10-thumbnail-v2-full-pipeline-design.md`

---

## 기존 코드 현황 (중요!)

구현 전 반드시 읽어야 할 파일들:

| 파일 | 상태 | 참고 |
|------|------|------|
| `backend/src/youtube-supporter/services/replicate.service.ts` | **교체 대상** | DALL-E 3 래퍼 (105줄) |
| `backend/src/youtube-supporter/services/thumbnail-composer.service.ts` | **수정 대상** | SVG 텍스트 합성 (425줄) |
| `backend/src/youtube-supporter/services/ai-orchestration.service.ts:835-936` | **수정 대상** | 전략 생성 프롬프트 |
| `backend/src/youtube-supporter/youtube-supporter.service.ts:1880+` | **수정 대상** | generateCompleteThumbnails 메서드 |
| `backend/src/youtube-supporter/youtube-supporter.service.ts:1337-1374` | **수정 대상** | generateThumbnailImage 메서드 |
| `backend/src/youtube-supporter/youtube-supporter.controller.ts:937-982` | **수정 대상** | generate-complete + variation 엔드포인트 |
| `backend/prisma/schema.prisma:1032-1050` | **확장** | YtThumbnail 모델 |
| `backend/Dockerfile:33` | **수정** | 폰트 패키지 추가 |
| `frontend/app/yt/components/tabs/thumbnail/CanvasEditor.tsx` | **이미 구현** (510줄) | 수정만 필요 |
| `frontend/app/yt/components/tabs/thumbnail/CreateView.tsx` | **수정 대상** | 엔진 표시, 얼굴 합성 상태 |
| `frontend/app/yt/lib/api.ts:726-755` | **수정 대상** | generateCompleteThumbnails, variation 함수 |

---

## Task 0: DB 마이그레이션 (선행)

**Files:**
- Modify: `backend/prisma/schema.prisma:1032-1050`
- Create: `backend/prisma/migrations/YYYYMMDD_thumbnail_v2/migration.sql` (자동 생성)

- [ ] **Step 1: YtThumbnail 모델에 신규 필드 추가**

`backend/prisma/schema.prisma`에서 YtThumbnail 모델 수정:

```prisma
model YtThumbnail {
  id              String     @id @default(uuid())
  projectId       String?
  project         YtProject? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  imageUrl        String?
  baseImageUrl    String?
  personImageUrl  String?
  canvasData      Json?
  strategy        Json?
  prompt          String?    @db.Text
  status          String     @default("DRAFT")
  feedbackRating  String?
  feedbackComment String?
  // V2 신규 필드
  engine          String?    // 'gpt-image-1' | 'flux-2-pro' (구현 시 OpenAI docs에서 모델ID 확인)
  hasFace         Boolean    @default(false)
  parentId        String?    // 변형 원본 ID
  variationOf     String?    // 변형 타입
  finalUrl        String?    // 캔버스 편집 후 최종 PNG
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([projectId])
  @@index([createdAt])
  @@index([parentId])
}
```

- [ ] **Step 2: YtFaceReference 모델 추가**

같은 파일에 새 모델 추가:

```prisma
model YtFaceReference {
  id        String   @id @default(uuid())
  imageUrl  String
  label     String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([isActive])
}
```

- [ ] **Step 3: 마이그레이션 생성 및 적용**

Run: `cd backend && npx prisma migrate dev --name thumbnail_v2_fields`
Expected: Migration applied successfully

- [ ] **Step 4: Prisma Client 재생성 확인**

Run: `cd backend && npx prisma generate`
Expected: Prisma Client generated

- [ ] **Step 5: 커밋**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "db: YtThumbnail V2 필드 추가 + YtFaceReference 모델 생성"
```

---

## Task 1: ImageEngineService — 듀얼 엔진 (GPT Image + FLUX 2 Pro)

**Files:**
- Create: `backend/src/youtube-supporter/services/image-engine.service.ts`
- Modify: `backend/src/youtube-supporter/youtube-supporter.module.ts:20-29`
- Modify: `backend/src/youtube-supporter/youtube-supporter.service.ts:1337-1374` (generateThumbnailImage)
- Modify: `backend/src/youtube-supporter/youtube-supporter.service.ts:1880+` (generateCompleteThumbnails)

- [ ] **Step 1: fal.ai SDK 설치**

Run: `cd backend && npm install @fal-ai/client`
Expected: 패키지 설치 성공

- [ ] **Step 2: ImageEngineService 생성**

Create `backend/src/youtube-supporter/services/image-engine.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';

interface ImageGenerationRequest {
  prompt: string;
  engine: 'gpt-image-1' | 'flux-2-pro' | 'auto'; // 모델ID는 구현 시 OpenAI docs 확인
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
}

interface ImageGenerationResult {
  imageUrl: string;
  engine: string;
  cost: number; // 예상 비용 (USD)
  metadata: Record<string, unknown>;
}

@Injectable()
export class ImageEngineService {
  private readonly logger = new Logger('ImageEngine');
  private openaiClient: any = null;
  private falConfigured = false;

  constructor() {
    this.initOpenAI();
    this.initFal();
  }

  private async initOpenAI() { /* OpenAI SDK 동적 로드 — replicate.service.ts 패턴 참고 */ }
  private initFal() { /* fal.ai 클라이언트 초기화 — FAL_AI_API_KEY */ }

  async generate(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const engine = req.engine === 'auto'
      ? this.selectEngine(req.prompt)
      : req.engine;

    if (engine === 'flux-2-pro' && this.falConfigured) {
      return this.generateFlux(req);
    }
    return this.generateGptImage(req);
  }

  private selectEngine(prompt: string): 'gpt-image' | 'flux-2-pro' {
    // recommendedEngine 파싱 또는 키워드 매칭 폴백
  }

  private async generateGptImage(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // OpenAI gpt-image-1 API 호출
    // model: 'gpt-image-1', quality: req.quality || 'high'
    // 사이즈: 1792x1024 (썸네일에 가장 가까운 옵션)
  }

  private async generateFlux(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // fal.ai FLUX 2 Pro API 호출
    // fal.subscribe('fal-ai/flux-2-pro', { input: { prompt, image_size: { width: 1792, height: 1024 } } })
  }
}
```

- [ ] **Step 3: 모듈에 ImageEngineService 등록**

`youtube-supporter.module.ts` providers 배열에 `ImageEngineService` 추가.

- [ ] **Step 4: generateThumbnailImage 메서드에서 ReplicateService → ImageEngineService 교체**

`youtube-supporter.service.ts:1337-1374`에서:
- `this.replicateService.generateImage(prompt)` → `this.imageEngineService.generate({ prompt, engine: 'auto' })`
- 반환된 `imageUrl`을 S3에 즉시 복사 (URL 만료 대응)
- `engine` 필드를 YtThumbnail 레코드에 저장

- [ ] **Step 5: generateCompleteThumbnails에서도 동일하게 교체**

`youtube-supporter.service.ts:1880+`에서:
- 전략 JSON에 `recommendedEngine` 필드가 있으면 사용
- 없으면 `engine: 'auto'`

- [ ] **Step 6: 환경변수 추가**

`backend/.env`에 `FAL_AI_API_KEY=` 추가.
`docker-compose.prod.yml`에 `FAL_AI_API_KEY: ${FAL_AI_API_KEY:-}` 추가.

- [ ] **Step 7: 로컬 테스트**

Run: `cd backend && npm run build`
Expected: 빌드 성공

수동 테스트: 프론트엔드에서 썸네일 생성 → 이미지가 실사급인지 육안 확인

- [ ] **Step 8: 커밋**

```bash
git add backend/src/youtube-supporter/services/image-engine.service.ts
git add backend/src/youtube-supporter/youtube-supporter.module.ts
git add backend/src/youtube-supporter/youtube-supporter.service.ts
git add backend/.env.example docker-compose.prod.yml
git commit -m "feat: 듀얼 이미지 엔진 (GPT Image + FLUX 2 Pro) 교체

DALL-E 3 → ImageEngineService로 교체. 전략 recommendedEngine 기반
자동 엔진 선택. fal.ai FLUX 2 Pro 연동. S3 즉시 복사."
```

---

## Task 2: AI 전략 프롬프트 업데이트

**Files:**
- Modify: `backend/src/youtube-supporter/services/ai-orchestration.service.ts:835-936`

- [ ] **Step 1: 전략 JSON에 recommendedEngine 필드 추가**

`ai-orchestration.service.ts`의 전략 생성 프롬프트에서:
- 출력 JSON 스키마에 `"recommendedEngine": "gpt-image" | "flux-2-pro"` 필드 추가
- 규칙: "인물이 포함된 장면이면 gpt-image, 사물/차량/부품 클로즈업이면 flux-2-pro"
- `fluxPrompt` → `imagePrompt`로 네이밍 변경 (하위 호환 유지: 둘 다 파싱)

- [ ] **Step 2: 프롬프트에서 "DALL-E 3" 참조를 "AI image generator"로 변경**

기존: "Generate a YouTube thumbnail background using DALL-E 3..."
변경: "Generate a YouTube thumbnail background. The image will be created by AI..."
(엔진에 구애받지 않는 범용 프롬프트)

- [ ] **Step 3: 빌드 확인**

Run: `cd backend && npm run build`
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add backend/src/youtube-supporter/services/ai-orchestration.service.ts
git commit -m "feat: 전략 JSON에 recommendedEngine 필드 추가 + 범용 프롬프트"
```

---

## Task 3: 텍스트 품질 업그레이드

**Files:**
- Modify: `backend/Dockerfile:33`
- Modify: `backend/src/youtube-supporter/services/thumbnail-composer.service.ts`

- [ ] **Step 1: Dockerfile에 프로 한글 폰트 추가**

`backend/Dockerfile:33` 수정:

기존: `RUN apk add --no-cache dumb-init vips font-noto-cjk`
변경: `RUN apk add --no-cache dumb-init vips font-noto-cjk && mkdir -p /usr/share/fonts/custom`

그리고 폰트 파일 복사 단계 추가:
```dockerfile
COPY fonts/ /usr/share/fonts/custom/
RUN fc-cache -f -v
```

`backend/fonts/` 디렉토리에 다운로드해야 할 폰트:
- `BlackHanSans-Regular.ttf` (Google Fonts)
- `NotoSansKR-Black.ttf` (Google Fonts)
- `Jua-Regular.ttf` (Google Fonts)

- [ ] **Step 2: 폰트 다운로드**

Run:
```bash
mkdir -p backend/fonts
curl -L -o backend/fonts/BlackHanSans-Regular.ttf "https://fonts.google.com/download?family=Black+Han+Sans" || echo "수동 다운로드 필요"
```

참고: Google Fonts에서 직접 다운로드 후 `backend/fonts/`에 배치. TTF 파일만 필요.

- [ ] **Step 3: ThumbnailComposerService 텍스트 효과 다중 레이어화**

`thumbnail-composer.service.ts`의 `createHarnessTextSvg` 메서드 수정:

기존 SVG filter:
```xml
<filter id="ts">
  <feDropShadow dx="0" dy="0" stdDeviation="8" .../>
  <feDropShadow dx="4" dy="4" stdDeviation="4" .../>
</filter>
```

변경 (4중 레이어):
```xml
<filter id="ts" x="-20%" y="-20%" width="140%" height="140%">
  <!-- Layer 1: 글로우 (accent color) -->
  <feDropShadow dx="0" dy="0" stdDeviation="20" flood-color="{accentColor}" flood-opacity="0.35"/>
  <!-- Layer 2: 깊은 그림자 -->
  <feDropShadow dx="5" dy="5" stdDeviation="6" flood-color="#000" flood-opacity="0.8"/>
  <!-- Layer 3: 선명 그림자 -->
  <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#000" flood-opacity="0.95"/>
</filter>
```

- [ ] **Step 4: 폰트 자동 선택 로직 추가**

`ThumbnailComposerService`에 메서드 추가:

```typescript
private selectFont(emotionalTone?: string): string {
  if (!emotionalTone) return "'Black Han Sans','Noto Sans CJK KR',sans-serif";
  const tone = emotionalTone.toLowerCase();
  if (['긴급', '경고', '위험', '충격'].some(k => tone.includes(k)))
    return "'Black Han Sans','Noto Sans CJK KR',sans-serif";
  if (['교육', '정보', '팁', '가이드'].some(k => tone.includes(k)))
    return "'Noto Sans KR','Noto Sans CJK KR',sans-serif";
  if (['친근', '일상', '브이로그', '재미'].some(k => tone.includes(k)))
    return "'Jua','Noto Sans CJK KR',sans-serif";
  return "'Black Han Sans','Noto Sans CJK KR',sans-serif";
}
```

`createHarnessTextSvg`의 `font-family`를 이 메서드 반환값으로 교체.

- [ ] **Step 5: stroke 두께 증가**

`HARNESS.TEXT_STROKE_WIDTH`를 `10` → `14`로 증가 (폰트가 두꺼워지면 외곽선도 비례)

- [ ] **Step 6: 빌드 확인**

Run: `cd backend && npm run build`
Expected: 빌드 성공

- [ ] **Step 7: 로컬 Docker 빌드 테스트 (폰트 포함 확인)**

Run: `cd backend && docker build -t dreaming-mech-backend-test .`
Expected: 빌드 성공, fc-cache 폰트 등록 로그 확인

- [ ] **Step 8: 커밋**

```bash
git add backend/Dockerfile backend/fonts/ backend/src/youtube-supporter/services/thumbnail-composer.service.ts
git commit -m "feat: 프로 한글 폰트 3종 번들 + 4중 텍스트 효과 레이어

Black Han Sans(긴급), Noto Sans KR Black(교육), Jua(친근) 번들.
emotionalTone 기반 자동 폰트 선택. 글로우+그림자 4중 레이어."
```

---

## Task 4: FaceCompositeService — PuLID 얼굴 합성

**Files:**
- Create: `backend/src/youtube-supporter/services/face-composite.service.ts`
- Modify: `backend/src/youtube-supporter/youtube-supporter.module.ts`
- Modify: `backend/src/youtube-supporter/youtube-supporter.service.ts` (얼굴 CRUD + 합성 호출)
- Modify: `backend/src/youtube-supporter/youtube-supporter.controller.ts` (face 엔드포인트 3개)
- Modify: `backend/src/youtube-supporter/schemas/youtube-supporter.schema.ts` (스키마 추가)

- [ ] **Step 1: FaceCompositeService 생성**

Create `backend/src/youtube-supporter/services/face-composite.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FaceCompositeService {
  private readonly logger = new Logger('FaceComposite');

  /**
   * PuLID Flux로 얼굴 합성된 이미지 생성
   * @param prompt 인물 설명 프롬프트
   * @param referenceUrls 대장님 레퍼런스 사진 URL 배열
   * @returns 합성된 이미지 URL
   */
  async generateWithFace(
    prompt: string,
    referenceUrls: string[],
  ): Promise<{ imageUrl: string }> {
    // fal.ai PuLID Flux API 호출
    // fal.subscribe('fal-ai/flux-pulid', {
    //   input: {
    //     prompt,
    //     reference_image_url: referenceUrls[0], // PuLID는 단일 레퍼런스
    //     guidance_scale: 4,
    //     num_inference_steps: 25,
    //   }
    // })
    // 결과 이미지를 S3에 복사 후 URL 반환
  }

  /**
   * 활성 레퍼런스 사진 조회
   */
  async getActiveReferences(): Promise<string[]> {
    // Prisma에서 YtFaceReference.isActive=true 조회
    // imageUrl 배열 반환
  }
}
```

- [ ] **Step 2: 컨트롤러에 얼굴 관리 엔드포인트 3개 추가**

`youtube-supporter.controller.ts`에 추가:

```typescript
@Post('thumbnail/face/upload')
@UseInterceptors(FilesInterceptor('images', 20, { limits: { fileSize: 10 * 1024 * 1024 } }))
async thumbnailFaceUpload(@UploadedFiles() files: Express.Multer.File[], @Body() body: any) {
  return this.service.uploadFaceReferences(files, body.labels);
}

@Get('thumbnail/face/list')
async thumbnailFaceList() {
  return this.service.getFaceReferences();
}

@Delete('thumbnail/face/:id')
async thumbnailFaceDelete(@Param('id') id: string) {
  return this.service.deleteFaceReference(id);
}
```

- [ ] **Step 3: 서비스에 얼굴 CRUD 메서드 추가**

`youtube-supporter.service.ts`에 3개 메서드 추가:
- `uploadFaceReferences(files, labels)` — S3 업로드 + YtFaceReference 생성
- `getFaceReferences()` — 활성 레퍼런스 목록 조회
- `deleteFaceReference(id)` — S3 삭제 + DB 삭제

- [ ] **Step 4: generateCompleteThumbnails에 PuLID 합성 단계 추가**

`youtube-supporter.service.ts:1880+`의 generateCompleteThumbnails 메서드에서:
- 전략에 `personPosition`이 있으면 (인물 포함 전략):
  1. 활성 레퍼런스 사진 조회
  2. 레퍼런스가 있으면 → `faceCompositeService.generateWithFace()` 호출
  3. 레퍼런스가 없으면 → 기존 방식 (AI 이미지만)
- `hasFace: true` 필드 저장

- [ ] **Step 5: 모듈 등록**

`youtube-supporter.module.ts`에 `FaceCompositeService` 추가.

- [ ] **Step 6: 빌드 확인**

Run: `cd backend && npm run build`
Expected: 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add backend/src/youtube-supporter/services/face-composite.service.ts
git add backend/src/youtube-supporter/youtube-supporter.module.ts
git add backend/src/youtube-supporter/youtube-supporter.service.ts
git add backend/src/youtube-supporter/youtube-supporter.controller.ts
git commit -m "feat: PuLID 얼굴 합성 서비스 + 레퍼런스 사진 관리

fal.ai PuLID Flux API 연동. 얼굴 사진 업로드/조회/삭제 엔드포인트.
generateCompleteThumbnails에 자동 얼굴 합성 파이프라인 추가."
```

---

## Task 5: 변형 재생성 강화

**Files:**
- Create: `backend/src/youtube-supporter/services/variation.service.ts` (스펙 6.3 — 신규 파일)
- Modify: `backend/src/youtube-supporter/youtube-supporter.module.ts` (VariationService 등록)
- Modify: `backend/src/youtube-supporter/youtube-supporter.service.ts` (기존 variation 메서드 → VariationService 위임)
- Create: `frontend/app/yt/components/tabs/thumbnail/VariationPanel.tsx` (스펙 7.1 — 신규 파일)
- Modify: `frontend/app/yt/components/tabs/thumbnail/CreateView.tsx`
- Modify: `frontend/app/yt/components/tabs/thumbnail/types.ts` (VariationPanel 타입 추가)
- Modify: `frontend/app/yt/lib/api.ts`

**중요:** 기존 variation 코드 확인 먼저 — `youtube-supporter.service.ts`의 현재 variation 메서드 및 `CreateView.tsx`의 `VARIATION_OPTIONS` 코드를 읽고 시작할 것.

- [ ] **Step 0.5: 기존 variation 코드 확인**

Read: `backend/src/youtube-supporter/youtube-supporter.service.ts` — variation 관련 메서드 찾기
Read: `frontend/app/yt/components/tabs/thumbnail/CreateView.tsx:33-37` — 현재 VARIATION_OPTIONS

- [ ] **Step 1: VariationService 신규 파일 생성**

Create `backend/src/youtube-supporter/services/variation.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VariationService {
  private readonly logger = new Logger('Variation');

  /**
   * 변형 프롬프트 생성 (Claude 기반)
   * 원본 전략 + 변형 지시 → 수정된 프롬프트
   */
  async generateVariationPrompt(
    originalStrategy: any,
    originalPrompt: string,
    variation: string,
    customInstruction?: string,
  ): Promise<{ prompt: string; strategy: any }> {
    // Claude에게 원본 + 변형 지시를 주어 새 프롬프트 생성
    // 히스토리 컨텍스트 유지 — parentId 체인 조회
  }

  /**
   * 엔진 교차 생성 (different_engine)
   */
  getAlternateEngine(currentEngine: string): string {
    return currentEngine === 'gpt-image-1' ? 'flux-2-pro' : 'gpt-image-1';
  }
}
```

- [ ] **Step 1.5: VariationService 모듈 등록**

`youtube-supporter.module.ts`에 `VariationService` 추가.

- [ ] **Step 2: 변형 옵션 확장 (백엔드)**

기존 variation 메서드에서 옵션 확장:
- 기존: `more_clickbait`, `more_minimal`, `face_closer`, `dark_mode`
- 추가: `brighter_bg`, `stronger_text`, `different_engine`, `custom`
- `custom` 타입일 때 `customInstruction` 필드로 자유 텍스트 수정 지시

- [ ] **Step 2: parentId/variationOf 필드 저장**

변형 생성 시:
- `parentId`: 원본 썸네일 ID 저장
- `variationOf`: 변형 타입 저장
- `engine`: 사용된 엔진 저장

- [ ] **Step 3: different_engine 변형 구현**

`different_engine` 변형 시:
- 원본이 `gpt-image`이면 → `flux-2-pro`로 재생성 (또는 반대)
- 같은 프롬프트, 다른 엔진으로 비교

- [ ] **Step 4: 프론트엔드 CreateView 변형 옵션 확장**

`CreateView.tsx`의 `VARIATION_OPTIONS` 확장:
```typescript
const VARIATION_OPTIONS: VariationOption[] = [
  { label: '더 클릭베이트로', value: 'more_clickbait' },
  { label: '더 미니멀로', value: 'more_minimal' },
  { label: '얼굴 크게', value: 'face_closer' },
  { label: '다크모드', value: 'dark_mode' },
  { label: '배경 밝게', value: 'brighter_bg' },
  { label: '텍스트 강조', value: 'stronger_text' },
  { label: '다른 엔진으로', value: 'different_engine' },
];
```

- [ ] **Step 5: VariationPanel.tsx 신규 생성**

Create `frontend/app/yt/components/tabs/thumbnail/VariationPanel.tsx`:
- 변형 옵션 버튼 그리드 (8종)
- 자유 텍스트 입력 필드 (placeholder: "직접 수정 지시 입력")
- 입력 후 전송 → `variation: 'custom', customInstruction: '...'`
- 변형 히스토리 표시 (parentId 체인)

- [ ] **Step 5.5: CreateView에서 기존 인라인 변형 드롭다운 → VariationPanel 교체**

CreateView의 변형 드롭다운을 VariationPanel 컴포넌트로 교체.

- [ ] **Step 5.7: types.ts 업데이트**

`frontend/app/yt/components/tabs/thumbnail/types.ts`에 추가:
```typescript
export interface VariationPanelProps {
  thumbnailId: string;
  currentEngine?: string;
  onVariation: (result: { id: string; imageUrl: string }) => void;
  loading?: boolean;
}
```

- [ ] **Step 6: 빌드 확인**

Run: `cd frontend && npm run build && cd ../backend && npm run build`
Expected: 둘 다 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add backend/src/youtube-supporter/services/variation.service.ts
git add backend/src/youtube-supporter/youtube-supporter.module.ts
git add backend/src/youtube-supporter/youtube-supporter.service.ts
git add frontend/app/yt/components/tabs/thumbnail/VariationPanel.tsx
git add frontend/app/yt/components/tabs/thumbnail/CreateView.tsx
git add frontend/app/yt/components/tabs/thumbnail/types.ts
git add frontend/app/yt/lib/api.ts
git commit -m "feat: VariationService + VariationPanel — 8종 옵션 + 자유 텍스트

VariationService 분리. VariationPanel 컴포넌트. parentId/variationOf 추적.
different_engine으로 엔진 간 비교. custom 자유 텍스트 지시."
```

---

## Task 6: 프론트엔드 FaceManager + 엔진 표시

**Files:**
- Create: `frontend/app/yt/components/tabs/thumbnail/FaceManager.tsx`
- Modify: `frontend/app/yt/components/tabs/thumbnail/ThumbnailTab.tsx`
- Modify: `frontend/app/yt/components/tabs/thumbnail/CreateView.tsx`
- Modify: `frontend/app/yt/lib/api.ts`

- [ ] **Step 1: api.ts에 얼굴 관리 API 함수 추가**

```typescript
export async function uploadFaceReferences(files: File[], labels?: string[]) {
  const formData = new FormData();
  files.forEach(f => formData.append('images', f));
  if (labels) formData.append('labels', JSON.stringify(labels));
  return ytApi.post('/thumbnail/face/upload', formData).then(r => r.data);
}

export async function getFaceReferences() {
  return ytApi.get('/thumbnail/face/list').then(r => r.data);
}

export async function deleteFaceReference(id: string) {
  return ytApi.delete(`/thumbnail/face/${id}`).then(r => r.data);
}
```

- [ ] **Step 2: FaceManager.tsx 생성**

사진 업로드 + 그리드 미리보기 + 삭제 기능:
- 드래그앤드롭 또는 파일 선택
- 최대 20장, 각 10MB
- 레이블 입력 (정면/측면/작업복 등)
- 업로드된 사진 그리드 표시 + 삭제 버튼

- [ ] **Step 3: ThumbnailTab에 FaceManager 탭 추가**

기존 4개 탭에 '얼굴 설정' 탭 추가 (아이콘: User)

- [ ] **Step 4: CreateView에 엔진/얼굴 상태 표시**

생성된 카드에 표시:
- 뱃지: "GPT Image" 또는 "FLUX 2 Pro" (사용된 엔진)
- 뱃지: "얼굴 합성" (hasFace=true일 때)

- [ ] **Step 5: 빌드 확인**

Run: `cd frontend && npm run build`
Expected: 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add frontend/app/yt/components/tabs/thumbnail/FaceManager.tsx
git add frontend/app/yt/components/tabs/thumbnail/ThumbnailTab.tsx
git add frontend/app/yt/components/tabs/thumbnail/CreateView.tsx
git add frontend/app/yt/lib/api.ts
git commit -m "feat: 얼굴 사진 관리 UI + 엔진/얼굴 뱃지 표시

FaceManager 컴포넌트 (드래그앤드롭, 그리드, 레이블).
CreateView 카드에 사용 엔진 및 얼굴 합성 뱃지 표시."
```

---

## Task 7: 캔버스 편집기 폰트 업그레이드 + canvas/export API

**Files:**
- Modify: `frontend/app/yt/components/tabs/thumbnail/CanvasEditor.tsx:72-77`
- Modify: `backend/src/youtube-supporter/youtube-supporter.controller.ts` (canvas/export 엔드포인트)
- Modify: `backend/src/youtube-supporter/youtube-supporter.service.ts` (canvas export 메서드)

- [ ] **Step 1: FONT_OPTIONS에 새 폰트 추가**

기존 CanvasEditor의 FONT_OPTIONS 확인 후, 서버에 번들된 폰트와 동기화:
```typescript
const FONT_OPTIONS = [
  { label: '블랙한산스 (긴급)', value: 'Black Han Sans' },
  { label: '노토산스 블랙 (교육)', value: 'Noto Sans KR' },
  { label: '주아 (친근)', value: 'Jua' },
];
```

- [ ] **Step 2: FontFace API로 폰트 프리로드**

```typescript
useEffect(() => {
  const fonts = [
    new FontFace('Black Han Sans', 'url(https://fonts.gstatic.com/s/blackhansans/v17/ea8Aad44WunzF9a-dL6toA8r8nqVIXSkH-Hc.woff2)'),
    // ... Noto Sans KR, Jua도 동일
  ];
  Promise.all(fonts.map(f => f.load().then(loaded => document.fonts.add(loaded))));
}, []);
```

- [ ] **Step 3: canvas/export 엔드포인트 구현 (스펙 4.3)**

`youtube-supporter.controller.ts`에 추가:
```typescript
@Post('thumbnail/canvas/export')
async thumbnailCanvasExport(@Body() body: { canvasData: any; thumbnailId: string }) {
  return this.service.exportCanvas(body.thumbnailId, body.canvasData);
}
```

`youtube-supporter.service.ts`에 `exportCanvas` 메서드:
- canvasData에서 PNG 생성 (또는 프론트에서 base64로 전송)
- S3 업로드
- YtThumbnail.finalUrl 업데이트

- [ ] **Step 3.5: CanvasEditor에서 내보내기 시 새 API 호출**

기존 CanvasEditor의 내보내기 로직에서 `uploadCanvasToS3` → `thumbnailCanvasExport` API로 교체하여 `finalUrl` 필드도 업데이트되도록 수정.

- [ ] **Step 4: 빌드 확인**

Run: `cd frontend && npm run build && cd ../backend && npm run build`
Expected: 둘 다 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add frontend/app/yt/components/tabs/thumbnail/CanvasEditor.tsx
git add backend/src/youtube-supporter/youtube-supporter.controller.ts
git add backend/src/youtube-supporter/youtube-supporter.service.ts
git commit -m "feat: 캔버스 프로 폰트 3종 + canvas/export API 연동

FontFace 프리로드. POST /thumbnail/canvas/export → finalUrl 저장."
```

---

## Task 8: 통합 테스트 + 로컬 확인

- [ ] **Step 1: 백엔드 전체 빌드**

Run: `cd backend && npm run build`
Expected: 빌드 성공, 0 에러

- [ ] **Step 2: 프론트엔드 전체 빌드**

Run: `cd frontend && npm run build`
Expected: 빌드 성공, 0 에러

- [ ] **Step 3: 로컬 서버 실행**

Run: `cd frontend && npm run dev`
Expected: http://localhost:3000 에서 접근 가능

- [ ] **Step 4: 수동 통합 테스트 시나리오**

1. 썸네일 생성 → 3안 나오는지 확인
2. 카드에 엔진 뱃지 표시되는지 확인
3. 변형 옵션 8종 + 자유 텍스트 동작 확인
4. 텍스트 품질 (폰트, 그림자) 확인
5. 캔버스 편집기에서 텍스트 편집 → 내보내기 확인
6. (fal.ai 키 있으면) FLUX 2 Pro 이미지 품질 확인
7. (얼굴 사진 있으면) PuLID 합성 결과 확인

- [ ] **Step 5: 대장님 로컬 확인**

대장님이 http://localhost:3000 에서 직접 결과물 확인

- [ ] **Step 6: 최종 커밋**

```bash
git commit -m "chore: 썸네일 V2 풀 파이프라인 통합 완료

듀얼 엔진 + PuLID 얼굴 합성 + 프로 폰트 + 변형 강화."
```

---

## 선행 조건 체크리스트

| 항목 | 담당 | 상태 |
|------|------|------|
| fal.ai 가입 + API 키 | 대장님 | ⬜ |
| `.env`에 `FAL_AI_API_KEY` 추가 | 소위 | ⬜ |
| 대장님 사진 10~20장 준비 | 대장님 | ⬜ |
| Google Fonts에서 TTF 3종 다운로드 | 소위 | ⬜ |
