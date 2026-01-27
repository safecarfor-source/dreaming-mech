# 꿈꾸는정비사 프로젝트 개선사항

> **최종 검토일**: 2026-01-21
> **현재 상태**: Phase 7 완료 (이미지 업로드)
> **종합 평가**: B+ (85/100) - 프로덕션 배포 전 보안 이슈 해결 필수

---

## 🔴 CRITICAL - 즉시 해결 필수 (배포 전 필수)

### 1. JWT 비밀키 하드코딩 제거
**파일**: `backend/src/auth/jwt.strategy.ts` 라인 11, `backend/src/auth/auth.module.ts` 라인 14

**현재 코드**:
```typescript
secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
```

**문제점**:
- 환경변수 미설정 시 예측 가능한 키 사용
- 토큰 위조 공격 가능
- 인증 시스템 완전 무력화

**수정 방법**:
```typescript
// jwt.strategy.ts
const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('JWT_SECRET environment variable is required');
}

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }
}
```

**예상 작업 시간**: 15분

---

### 2. 관리자 API 엔드포인트 인증 보호
**파일**: `backend/src/mechanic/mechanic.controller.ts`

**문제점**:
- `/mechanics` POST, PATCH, DELETE 엔드포인트에 `@UseGuards(JwtAuthGuard)` 미적용
- 현재 누구나 정비사 정보를 생성/수정/삭제 가능
- **심각한 보안 취약점**

**수정 방법**:
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mechanics')
export class MechanicController {
  @Get()  // 공개 엔드포인트
  findAll() {}

  @Get(':id')  // 공개 엔드포인트
  findOne(@Param('id') id: number) {}

  @UseGuards(JwtAuthGuard)  // ✅ 추가
  @Post()
  create(@Body() dto: CreateMechanicDto) {}

  @UseGuards(JwtAuthGuard)  // ✅ 추가
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateMechanicDto) {}

  @UseGuards(JwtAuthGuard)  // ✅ 추가
  @Delete(':id')
  remove(@Param('id') id: number) {}
}
```

**예상 작업 시간**: 10분

---

### 3. 파일 업로드 검증 추가
**파일**: `backend/src/upload/upload.service.ts`, `upload.controller.ts`

**문제점**:
- 파일 타입 검증 없음 (악성 파일 업로드 가능)
- 파일 크기 제한 없음 (DoS 공격 가능)
- 인증 미적용 (누구나 업로드 가능)

**수정 방법**:
```typescript
// upload.controller.ts
import {
  BadRequestException,
  UseGuards,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseGuards(JwtAuthGuard)  // ✅ 인증 추가
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    // 파일 타입 검증
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // 확장자 검증
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      throw new BadRequestException('Invalid file extension');
    }

    return this.uploadService.uploadImage(file);
  }
}
```

**예상 작업 시간**: 30분

---

### 4. 테스트 계정 정보 노출 제거
**파일**: `frontend/app/admin/login/page.tsx` 라인 135

**현재 코드**:
```typescript
<p className="text-center text-gray-500 text-sm mt-6">
  테스트 계정: admin@test.com / admin123
</p>
```

**수정 방법**:
```typescript
{process.env.NODE_ENV === 'development' && (
  <p className="text-center text-gray-500 text-sm mt-6">
    테스트 계정: admin@test.com / admin123
  </p>
)}
```

**예상 작업 시간**: 5분

---

### 5. CORS 설정 환경변수화
**파일**: `backend/src/main.ts` 라인 9-12

**현재 코드**:
```typescript
app.enableCors({
  origin: 'http://localhost:3000',  // ❌ 하드코딩
  credentials: true,
});
```

**수정 방법**:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

`.env` 파일에 추가:
```bash
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
```

**예상 작업 시간**: 10분

---

### 6. JWT 토큰 만료 시간 조정
**파일**: `backend/src/auth/auth.module.ts` 라인 15

**현재 설정**: 7일 (너무 김)
**권장 설정**: 24시간

**수정 방법**:
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '24h' },  // 7d → 24h
})
```

**예상 작업 시간**: 5분

---

### 7. Seed 파일 평문 비밀번호 제거
**파일**: `backend/prisma/seed.ts` 라인 10

**수정 방법**: 주석으로 표시하거나 환경변수로 분리

```typescript
// 프로덕션에서는 절대 사용하지 말 것!
const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
```

**예상 작업 시간**: 5분

---

## 🟠 HIGH - 반드시 해결 (1-2주 내)

### 8. Next.js/React 버전 다운그레이드
**파일**: `frontend/package.json`

**문제점**:
- Next.js 16.1.2: 2026년 1월 릴리스, 프로덕션 검증 부족
- React 19.2.3: Beta/RC 단계, 정식 출시 전
- 서드파티 라이브러리 호환성 이슈 가능성

**권장 버전**:
```json
{
  "dependencies": {
    "next": "15.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

**작업 순서**:
```bash
cd frontend
npm install next@15.2.0 react@^18.3.1 react-dom@^18.3.1
npm test  # 테스트 실행
```

**예상 작업 시간**: 1시간 (테스트 포함)

---

### 9. 패키지 버전 수정
**파일**: `backend/package.json`

**문제점**:
- `bcrypt: ^6.0.0` - 존재하지 않는 버전
- `axios: ^1.13.2` - 존재하지 않는 버전

**수정 방법**:
```bash
cd backend
npm install bcrypt@^5.1.1 axios@^1.6.7
```

**예상 작업 시간**: 30분

---

### 10. React Query 통합 (이미 설치됨!)
**현재 상태**: `@tanstack/react-query@5.90.18` 설치되어 있으나 미사용

**문제점**:
- API 호출이 각 컴포넌트에서 `useEffect` + `fetch`로 반복
- 로딩/에러 상태가 각 컴포넌트마다 중복
- 캐싱, 재시도 로직 없음

**수정 방법**:
```typescript
// lib/hooks/useMechanics.ts (새로 생성)
import { useQuery } from '@tanstack/react-query';
import { mechanicsApi } from '@/lib/api';

export function useMechanics() {
  return useQuery({
    queryKey: ['mechanics'],
    queryFn: mechanicsApi.getAll,
    select: (data) => ({
      mechanics: data.data,
      totalClicks: data.data.reduce((sum, m) => sum + m.clickCount, 0),
    }),
  });
}

// app/page.tsx (리팩터링 후)
'use client';
import { useMechanics } from '@/lib/hooks/useMechanics';

export default function Home() {
  const { data, isLoading, error } = useMechanics();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.mechanics.map(mechanic => (
        <MechanicCard key={mechanic.id} mechanic={mechanic} />
      ))}
    </div>
  );
}
```

**예상 작업 시간**: 2-3시간

---

### 11. 중앙 집중식 에러 핸들링
**파일**: `frontend/lib/error-handler.ts` (새로 생성)

**문제점**:
- 어떤 곳은 `alert()`, 어떤 곳은 `console.error()`만
- 401/403 에러 처리 일관성 없음

**수정 방법**:
```typescript
// lib/error-handler.ts
import axios from 'axios';
import { useRouter } from 'next/navigation';

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      // 인증 만료 처리
      localStorage.removeItem('auth-storage');
      window.location.href = '/admin/login';
      return '인증이 만료되었습니다. 다시 로그인해주세요.';
    }

    if (status === 403) {
      return '접근 권한이 없습니다.';
    }

    if (status === 404) {
      return '요청한 데이터를 찾을 수 없습니다.';
    }

    if (status === 413) {
      return '파일 크기가 너무 큽니다. (최대 5MB)';
    }

    return message || '서버 오류가 발생했습니다.';
  }

  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
};

// 사용 예시
try {
  await mechanicsApi.create(data);
} catch (error) {
  const errorMessage = handleApiError(error);
  alert(errorMessage);
}
```

**예상 작업 시간**: 1-2시간

---

### 12. 데이터베이스 인덱스 최적화
**파일**: `backend/prisma/schema.prisma`

**현재 인덱스**:
```prisma
@@index([location])
@@index([isActive])
```

**개선안** (복합 인덱스 추가):
```prisma
model Mechanic {
  // ... 기존 필드

  @@index([isActive, location])  // 복합 인덱스 (함께 쿼리됨)
  @@index([clickCount])          // 인기 정비사 정렬용
  @@index([createdAt])           // 최신순 정렬용
}

model ClickLog {
  // ... 기존 필드

  @@index([mechanicId, clickedAt])  // 특정 정비사의 시간별 클릭 조회
  @@index([ipAddress])              // IP 기반 중복 클릭 방지용
}
```

**마이그레이션**:
```bash
cd backend
npx prisma migrate dev --name add_performance_indexes
```

**예상 성능 향상**: 15-30% (목록 조회 쿼리)
**예상 작업 시간**: 30분

---

### 13. TypeScript any 타입 제거
**파일**: `frontend/components/admin/EditableMap.tsx` 라인 18, 30, 49

**현재 코드**:
```typescript
const [map, setMap] = useState<any>(null);
const [markerInstance, setMarkerInstance] = useState<any>(null);
const naver = (window as any).naver;
```

**수정 방법**:
```typescript
// types/naver.d.ts (새로 생성)
declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new(element: HTMLElement, options: NaverMapOptions) => NaverMapInstance;
        Marker: new(options: NaverMarkerOptions) => NaverMarkerInstance;
        LatLng: new(lat: number, lng: number) => NaverLatLng;
        Event: {
          addListener: (obj: any, event: string, callback: Function) => void;
        };
        Position: { TOP_RIGHT: string };
      };
    };
  }
}

interface NaverMapOptions {
  center: NaverLatLng;
  zoom: number;
}

interface NaverMapInstance {
  setCenter: (latLng: NaverLatLng) => void;
  // ... 필요한 메서드 추가
}

interface NaverMarkerInstance {
  setPosition: (latLng: NaverLatLng) => void;
  setMap: (map: NaverMapInstance | null) => void;
}

interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

export {};

// EditableMap.tsx에서 사용
const [map, setMap] = useState<NaverMapInstance | null>(null);
const [markerInstance, setMarkerInstance] = useState<NaverMarkerInstance | null>(null);
const naver = window.naver;
```

**예상 작업 시간**: 1시간

---

## 🟡 MEDIUM - 개선 권장 (2-4주 내)

### 14. MechanicForm 컴포넌트 분리
**파일**: `frontend/components/admin/MechanicForm.tsx` (328줄)

**문제점**:
- Single Responsibility Principle 위반
- 5개 책임 혼재: 폼 상태, 지도, 이미지, 주소검색, 제출
- 테스트 어려움
- 재사용 불가

**리팩토링 구조**:
```
components/admin/mechanic-form/
├── MechanicForm.tsx (컨테이너, 80줄)
├── BasicInfoSection.tsx (이름, 전화, 설명 - 50줄)
├── LocationSection.tsx (주소 검색, 지도 - 60줄)
├── MediaSection.tsx (이미지, 유튜브 - 50줄)
└── FormActions.tsx (제출, 취소 버튼 - 30줄)
```

**예상 작업 시간**: 4-6시간

---

### 15. 환경변수 일관성 개선
**파일**: `frontend/lib/config.ts` (새로 생성)

**문제점**:
- `process.env.NEXT_PUBLIC_API_URL`이 여러 곳에서 하드코딩
- 필수 환경변수 검증 로직 없음

**수정 방법**:
```typescript
// lib/config.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  naverMapClientId: process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!,
} as const;

// 사용
import { config } from '@/lib/config';
const response = await fetch(`${config.apiUrl}/maps/geocode?address=...`);
```

**예상 작업 시간**: 1시간

---

### 16. DTO 검증 강화
**파일**: `backend/src/mechanic/dto/create-mechanic.dto.ts`

**현재 문제점**:
- 전화번호 형식 검증 없음
- 위도/경도 범위 검증 없음
- URL 도메인 화이트리스트 없음

**수정 방법**:
```typescript
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUrl,
  IsOptional,
  Matches,
  Min,
  Max,
  MaxLength,
  IsArray,
} from 'class-validator';

export class CreateMechanicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^01[0-9]-?\d{3,4}-?\d{4}$/, {
    message: '올바른 한국 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
  })
  phone: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  mapLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  mapLng: number;

  @IsUrl()
  @IsOptional()
  mainImageUrl?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  galleryImages?: string[];

  @IsUrl()
  @IsOptional()
  @Matches(/^https:\/\/(www\.)?youtube\.com\//, {
    message: 'YouTube URL만 허용됩니다'
  })
  youtubeUrl?: string;
}
```

**예상 작업 시간**: 1시간

---

### 17. Axios 인터셉터 구현
**파일**: `frontend/lib/api.ts`

**문제점**:
- 인증 헤더를 매 요청마다 수동 추가
- 401 에러 자동 처리 없음

**수정 방법**:
```typescript
import axios from 'axios';
import { useAuthStore } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

// 요청 인터셉터
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**예상 작업 시간**: 30분

---

### 18. 로깅 시스템 개선
**파일**: 백엔드 전체

**문제점**:
- `console.log`, `console.error`만 사용
- 구조화된 로그 없음
- 로그 레벨 없음

**수정 방법**:
```typescript
// backend/src/common/logger.service.ts (새로 생성)
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }
}

// main.ts에서 사용
app.useLogger(new CustomLogger());
```

**의존성 추가**:
```bash
npm install winston
npm install -D @types/winston
```

**예상 작업 시간**: 2시간

---

## 🟢 LOW - 추가 개선 (필요 시)

### 19. API 버저닝
**파일**: `backend/src/main.ts`

**현재**: `/mechanics`
**권장**: `/api/v1/mechanics`

**수정 방법**:
```typescript
// main.ts
app.setGlobalPrefix('api/v1');
```

**예상 작업 시간**: 15분

---

### 20. 응답 형식 표준화
**파일**: 백엔드 모든 컨트롤러

**권장 구조**:
```typescript
// common/dto/api-response.dto.ts
export class ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  error?: {
    code: string;
    details?: any;
  };
}

// 사용 예시
@Get()
async findAll(): Promise<ApiResponse<Mechanic[]>> {
  const data = await this.mechanicService.findAll();
  return {
    success: true,
    data,
    message: 'Successfully retrieved mechanics',
    timestamp: new Date().toISOString(),
  };
}
```

**예상 작업 시간**: 3-4시간

---

### 21. Rate Limiting 구현
**파일**: `backend/src/main.ts`

**수정 방법**:
```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})

// 특정 엔드포인트에
import { Throttle } from '@nestjs/throttler';

@Throttle(5, 60)  // 60초에 5회 제한
@Post('login')
async login() {}
```

**예상 작업 시간**: 1시간

---

### 22. 테스트 코드 작성
**현재 상태**: 테스트 커버리지 0%

**목표**: 60% 커버리지

**우선순위**:
1. Auth 모듈 (로그인, JWT 검증)
2. Mechanic 서비스 (CRUD)
3. Upload 서비스 (파일 검증)

**예시**:
```typescript
// backend/src/mechanic/mechanic.service.spec.ts
describe('MechanicService', () => {
  let service: MechanicService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MechanicService, PrismaService],
    }).compile();

    service = module.get<MechanicService>(MechanicService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findOne', () => {
    it('should return a mechanic by id', async () => {
      const mockMechanic = { id: 1, name: 'Test Mechanic' };
      jest.spyOn(prisma.mechanic, 'findUnique').mockResolvedValue(mockMechanic as any);

      const result = await service.findOne(1);
      expect(result).toEqual(mockMechanic);
      expect(prisma.mechanic.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if mechanic not found', async () => {
      jest.spyOn(prisma.mechanic, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
```

**예상 작업 시간**: 10-15시간

---

## 🎨 디자인 시스템 개선

### 23. Figma 색상 토큰 중복 제거
**파일**: `figma-plugin-ui/ui-design-data.json`

**문제점**:
- `gray500`과 `gray666`이 동일한 값 (#666666)

**수정 방법**: `gray666` 제거

**예상 작업 시간**: 5분

---

### 24. 접근성 개선 - 보라색 버튼 색상 변경
**파일**: `frontend/app/globals.css`, 모든 버튼 컴포넌트

**문제점**:
- `#8B5CF6` + 흰색 텍스트 = 대비율 4.23:1 (WCAG AA 미달)

**수정 방법**:
```css
/* globals.css */
--accent: #7C3AED;  /* 기존 #8B5CF6에서 변경 */
```

**효과**: 대비율 5.70:1 (WCAG AA 충족)

**예상 작업 시간**: 30분

---

### 25. 디자인 토큰 체계화
**파일**: `frontend/app/globals.css`

**추가할 토큰**:
```css
:root {
  /* 기존 색상 */
  --background: #0a0a0a;
  --foreground: #ffffff;
  --surface: #111111;
  --accent: #7C3AED;
  --accent-light: #A78BFA;
  --accent-dark: #6D28D9;
  --text-muted: #888888;

  /* 추가: Neutral Colors */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-300: #d4d4d4;
  --gray-400: #a3a3a3;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #404040;
  --gray-800: #262626;
  --gray-900: #171717;

  /* 추가: Semantic Colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* 추가: Spacing Scale */
  --space-xs: 0.5rem;   /* 8px */
  --space-sm: 1rem;     /* 16px */
  --space-md: 1.5rem;   /* 24px */
  --space-lg: 2rem;     /* 32px */
  --space-xl: 4rem;     /* 64px */
  --space-2xl: 6rem;    /* 96px */

  /* 추가: Typography Scale */
  --text-xs: 0.75rem;   /* 12px */
  --text-sm: 0.875rem;  /* 14px */
  --text-base: 1rem;    /* 16px */
  --text-lg: 1.125rem;  /* 18px */
  --text-xl: 1.25rem;   /* 20px */
  --text-2xl: 1.5rem;   /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem;  /* 36px */
  --text-5xl: 3rem;     /* 48px */
  --text-6xl: 3.75rem;  /* 60px */
  --text-7xl: 4.5rem;   /* 72px */
  --text-8xl: 6rem;     /* 96px */
}
```

**예상 작업 시간**: 2시간

---

## 📋 배포 전 체크리스트

### 필수 항목
- [ ] 모든 Critical 이슈 해결 (1-7번)
- [ ] 환경변수 프로덕션 설정 완료
- [ ] `.env.example` 파일 업데이트
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 프로덕션 빌드 테스트 (`npm run build`)
- [ ] HTTPS/SSL 인증서 설정
- [ ] CORS origin 프로덕션 도메인으로 설정
- [ ] Cloudinary 프로덕션 계정 설정
- [ ] Seed 파일에서 테스트 데이터 제거 또는 주석 처리

### 권장 항목
- [ ] 로깅 시스템 구축
- [ ] 에러 모니터링 (Sentry 등) 설정
- [ ] 백업 전략 수립
- [ ] CI/CD 파이프라인 구축
- [ ] 성능 테스트 실행
- [ ] 보안 감사 실행

---

## 🎯 우선순위 요약

### Week 1 (즉시): Critical 이슈 해결
**소요 시간**: 약 4시간
- ✅ JWT 시크릿 하드코딩 제거 (15분)
- ✅ 관리자 API 인증 추가 (10분)
- ✅ 파일 업로드 검증 (30분)
- ✅ 테스트 계정 정보 제거 (5분)
- ✅ CORS 환경변수화 (10분)
- ✅ JWT 토큰 만료 시간 조정 (5분)
- ✅ Seed 비밀번호 처리 (5분)

### Week 2-3: High Priority
**소요 시간**: 약 8-10시간
- ✅ Next.js/React 버전 다운그레이드 (1시간)
- ✅ 패키지 버전 수정 (30분)
- ✅ React Query 통합 (2-3시간)
- ✅ 중앙 에러 핸들링 (1-2시간)
- ✅ DB 인덱스 최적화 (30분)
- ✅ TypeScript any 제거 (1시간)

### Week 4+: Medium/Low Priority
**소요 시간**: 약 20-30시간
- ⚪ MechanicForm 리팩토링 (4-6시간)
- ⚪ 환경변수 일관성 (1시간)
- ⚪ DTO 검증 강화 (1시간)
- ⚪ Axios 인터셉터 (30분)
- ⚪ 로깅 시스템 (2시간)
- ⚪ 테스트 작성 (10-15시간)

---

## 📞 문의 및 참고

**작성일**: 2026-01-21
**검토 에이전트**:
- Figma Design Specialist
- System Architect (TypeScript)
- Senior Backend Engineer
- Code Reviewer

**관련 문서**:
- `/Users/jh/Desktop/dreaming-mech/SETUP_NOTES.md` - 프로젝트 설정 문서
- `/Users/jh/Desktop/dreaming-mech/phases/` - 단계별 개발 문서

---

> 💡 **팁**: 이 문서는 지속적으로 업데이트해야 합니다. 이슈를 해결할 때마다 체크박스를 업데이트하고, 새로운 이슈 발견 시 추가하세요.
