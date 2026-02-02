# Dreaming Mech - Frontend

Next.js 기반의 정비사 찾기 웹 애플리케이션

## 🚀 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Maps**: Naver Maps API
- **UI Components**: Lucide React Icons
- **File Upload**: React Dropzone

## ✨ 주요 기능

### 사용자 페이지

#### 1. 메인 페이지
- 히어로 섹션 (타이핑 효과)
- 정비사 카드 그리드
- 실시간 클릭 통계

#### 2. 정비사 상세 모달
- 슬라이드업 애니메이션
- Naver 지도 표시
- YouTube 영상 임베드
- 전화 연결 버튼
- 클릭 카운트 자동 증가

### 관리자 페이지

#### 1. 로그인
- JWT 인증 (HttpOnly 쿠키)
- 보안 강화된 세션 관리

#### 2. 대시보드
- 사이트 통계 (일별/월별)
- 실시간 TOP 정비사
- 전체 정비사 월별 클릭 추이

#### 3. 정비사 관리
- 정비사 목록 (활성/비활성 필터)
- 정비사 추가/수정/삭제
- 이미지 업로드 (AWS S3)
- 드래그 가능한 지도 마커
- 주소 검색 (Geocoding)

## 🛠️ 환경 설정

### `.env.local` 파일
```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Naver Maps
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id
```

## 📥 설치 및 실행

### 설치
```bash
npm install
```

### 개발 모드 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 열기

### 프로덕션 빌드
```bash
npm run build
npm run start
```

### 린트
```bash
npm run lint
```

## 📱 주요 페이지

### Public Routes
- `/` - 메인 페이지 (정비사 목록)
- `/test-map` - 지도 테스트 페이지

### Admin Routes
- `/admin/login` - 관리자 로그인
- `/admin/dashboard` - 통계 대시보드
- `/admin/mechanics` - 정비사 관리
- `/admin/mechanics/new` - 정비사 등록
- `/admin/mechanics/[id]` - 정비사 수정

## 🎨 디자인 시스템

### Color Palette
- **Primary**: Purple (보라색 테마)
  - `purple-50` ~ `purple-950`
- **Accent**: Orange
  - `orange-500`, `orange-600`
- **Neutral**: Gray
  - `gray-50` ~ `gray-900`

### Typography
- **Font**: Geist Sans, Geist Mono
- **Headings**: Bold, Large sizes
- **Body**: Regular, 16px base

### Components
- Cards: White background, subtle shadow
- Buttons: Purple primary, Orange accent
- Modals: Slide-up animation
- Forms: Clean, minimal design

## 📂 프로젝트 구조

```
frontend/
├── app/                    # Next.js App Router
│   ├── admin/             # 관리자 페이지
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── mechanics/
│   ├── test-map/          # 지도 테스트
│   ├── layout.tsx
│   └── page.tsx           # 메인 페이지
├── components/
│   ├── admin/             # 관리자 컴포넌트
│   │   ├── AdminLayout.tsx
│   │   ├── EditableMap.tsx
│   │   ├── ImageUpload.tsx
│   │   └── MechanicForm.tsx
│   ├── HeroSection.tsx
│   ├── MechanicCard.tsx
│   ├── MechanicModal.tsx
│   ├── NaverMapView.tsx
│   └── YouTubeEmbed.tsx
├── lib/
│   ├── api.ts             # Axios 클라이언트
│   ├── auth.ts            # Zustand 인증 스토어
│   ├── naver-maps.ts      # Naver Maps 유틸
│   └── youtube.ts         # YouTube 유틸
├── types/
│   └── index.ts           # TypeScript 타입 정의
└── public/                # 정적 파일
```

## 🔌 API 연동

### Axios 설정
```typescript
// lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // JWT 쿠키 자동 전송
});
```

### 주요 API 함수
- `mechanicsApi.getAll()` - 정비사 목록
- `mechanicsApi.create()` - 정비사 등록
- `mechanicsApi.update()` - 정비사 수정
- `mechanicsApi.delete()` - 정비사 삭제
- `mapsApi.geocode()` - 주소 검색
- `analyticsApi.getSiteStats()` - 통계 조회

## 🗺️ Naver Maps 통합

### 지도 초기화
```typescript
import { initNaverMaps } from '@/lib/naver-maps';

useEffect(() => {
  initNaverMaps().then((naver) => {
    const map = new naver.maps.Map('map', {
      center: new naver.maps.LatLng(lat, lng),
      zoom: 15,
    });
  });
}, []);
```

### 마커 추가
```typescript
const marker = new naver.maps.Marker({
  position: new naver.maps.LatLng(lat, lng),
  map: map,
});
```

## 📤 이미지 업로드

### ImageUpload 컴포넌트
```typescript
import ImageUpload from '@/components/admin/ImageUpload';

<ImageUpload
  currentImage={formData.mainImageUrl}
  onUpload={(url) => setFormData({ ...formData, mainImageUrl: url })}
/>
```

### 기능
- Drag & Drop 지원
- 미리보기
- 최대 10MB
- JPEG, PNG, WebP 지원
- JWT 인증 자동 처리

## 🎭 애니메이션

### Framer Motion 사용
```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### 주요 애니메이션
- 페이드 인
- 슬라이드 업
- 스케일 변환
- 스태거 효과

## 🔒 보안

### JWT 인증
- HttpOnly 쿠키로 토큰 저장
- XSS 공격 방지
- Axios interceptor로 자동 처리

### Protected Routes
```typescript
// middleware.ts 또는 layout에서 처리
const { isAuthenticated } = useAuthStore();

if (!isAuthenticated) {
  router.push('/admin/login');
}
```

## 📱 반응형 디자인

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### 모바일 최적화
- 터치 제스처 지원
- 모바일 메뉴
- 반응형 그리드
- 이미지 최적화

## 🚀 배포

### Vercel (권장)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### 환경변수 설정
Vercel Dashboard에서 설정:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`

### 빌드 최적화
- Image Optimization
- Code Splitting
- Static Generation
- Incremental Static Regeneration

## 📊 성능

### Lighthouse 점수 목표
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

### 최적화 기법
- Next.js Image 컴포넌트
- Font Optimization
- Code Splitting
- Lazy Loading
- Memoization

## 📝 라이센스

MIT License

---

**Powered by Next.js** ⚡
