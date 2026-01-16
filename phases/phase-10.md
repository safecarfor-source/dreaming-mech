# Phase 10: 테스트 & 최적화

## 🎯 목표
API 테스트, SEO 최적화, 성능 개선을 진행합니다.

---

## Step 10-1: API 테스트

### Jest 테스트 (Backend)

#### `backend/src/mechanic/mechanic.service.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MechanicService } from './mechanic.service';
import { PrismaService } from '../prisma/prisma.service';

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of mechanics', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
```

### E2E 테스트

#### `backend/test/app.e2e-spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('MechanicController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/mechanics (GET)', () => {
    return request(app.getHttpServer())
      .get('/mechanics')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### 테스트 실행
```bash
cd backend
npm run test
npm run test:e2e
```

---

## Step 10-2: SEO 최적화

### Metadata (Frontend)

#### `frontend/app/layout.tsx`
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '정비사 찾기 - 믿을 수 있는 자동차 정비소',
  description: '검증된 정비사 정보를 한눈에 확인하세요. 위치, 연락처, 리뷰를 통해 최고의 정비소를 찾아보세요.',
  keywords: ['자동차 정비', '정비소', '카센터', '자동차 수리'],
  openGraph: {
    title: '정비사 찾기',
    description: '검증된 정비사 정보',
    images: ['/og-image.jpg'],
  },
};
```

### 동적 메타데이터

#### `frontend/app/mechanics/[id]/page.tsx`
```typescript
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const mechanic = await getMechanic(params.id);

  return {
    title: `${mechanic.name} - 정비사 찾기`,
    description: mechanic.description || `${mechanic.location}의 ${mechanic.name}`,
    openGraph: {
      images: [mechanic.mainImageUrl || '/default-og.jpg'],
    },
  };
}
```

### robots.txt

#### `frontend/public/robots.txt`
```
User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://yourdomain.com/sitemap.xml
```

### sitemap.xml

#### `frontend/app/sitemap.ts`
```typescript
import { MetadataRoute } from 'next';
import { mechanicsApi } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: mechanics } = await mechanicsApi.getAll();

  const mechanicUrls = mechanics.map((m) => ({
    url: `https://yourdomain.com/mechanics/${m.id}`,
    lastModified: new Date(m.updatedAt),
  }));

  return [
    {
      url: 'https://yourdomain.com',
      lastModified: new Date(),
      priority: 1,
    },
    ...mechanicUrls,
  ];
}
```

---

## Step 10-3: 성능 최적화

### Next.js Image 최적화

```typescript
import Image from 'next/image';

// Before
<img src={mechanic.mainImageUrl} alt={mechanic.name} />

// After
<Image
  src={mechanic.mainImageUrl}
  alt={mechanic.name}
  width={800}
  height={600}
  priority={index < 3} // 첫 3개만 우선 로딩
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

### React Query 캐싱

#### `frontend/lib/queryClient.ts`
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      cacheTime: 1000 * 60 * 30, // 30분
      refetchOnWindowFocus: false,
    },
  },
});
```

### 코드 스플리팅 (Dynamic Import)

```typescript
import dynamic from 'next/dynamic';

// 무거운 컴포넌트 lazy loading
const MechanicModal = dynamic(() => import('@/components/MechanicModal'), {
  loading: () => <div>로딩 중...</div>,
});

const AdminDashboard = dynamic(() => import('@/components/admin/Dashboard'), {
  ssr: false, // 서버 사이드 렌더링 비활성화
});
```

### Lighthouse 점수 확인

```bash
# 크롬 DevTools → Lighthouse 탭
# Performance, SEO, Accessibility 점수 확인

목표:
- Performance: 90+
- SEO: 95+
- Accessibility: 90+
- Best Practices: 90+
```

### 번들 크기 분석

```bash
cd frontend

# 번들 분석
npm run build
npx @next/bundle-analyzer

# 큰 패키지 제거 또는 대체
```

---

## ✅ Phase 10 완료

최종 체크리스트:
- [ ] Backend 테스트 작성 및 통과
- [ ] E2E 테스트 통과
- [ ] Metadata 설정
- [ ] robots.txt, sitemap.xml 생성
- [ ] Image 최적화
- [ ] React Query 캐싱 설정
- [ ] Dynamic Import 적용
- [ ] Lighthouse 점수 90+ 달성
- [ ] 번들 크기 최적화

```bash
git push origin feature/phase-10-testing-optimization
```

---

## 🎉 프로젝트 완료!

축하합니다! 정비사 웹사이트의 모든 Phase가 완료되었습니다.

### 최종 확인 사항

1. **기능 확인**
   - ✅ 정비사 목록 표시
   - ✅ 상세 모달 (지도, 유튜브)
   - ✅ 클릭 카운트
   - ✅ 관리자 로그인
   - ✅ 정비사 CRUD
   - ✅ 하이브리드 지도 편집
   - ✅ 이미지 업로드

2. **배포 확인**
   - ✅ Backend: AWS ECS
   - ✅ Frontend: Vercel
   - ✅ DB: RDS PostgreSQL
   - ✅ HTTPS 설정

3. **성능 확인**
   - ✅ Lighthouse 점수
   - ✅ 모바일 반응형
   - ✅ 로딩 속도

### 다음 단계 (선택)
- [ ] Google Analytics 연동
- [ ] 실제 정비사 데이터 입력
- [ ] 사용자 리뷰 기능
- [ ] 즐겨찾기 기능
- [ ] 카카오톡 공유
- [ ] PWA 변환

**수고하셨습니다! 🚀**
