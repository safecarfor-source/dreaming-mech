# Phase 8: 반응형 & 애니메이션

## 🎯 목표
모바일 최적화와 Framer Motion 애니메이션을 적용합니다.

---

## Step 8-1: 모바일 최적화

### Tailwind 반응형 체크

```typescript
// 모든 컴포넌트에 반응형 클래스 적용

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 텍스트
<h1 className="text-3xl md:text-4xl lg:text-6xl">

// 패딩
<div className="p-4 md:p-6 lg:p-8">

// 모달 (모바일 전체화면)
<motion.div className="fixed inset-0 md:inset-x-4 md:top-20">
```

### 모바일 네비게이션

#### `frontend/components/MobileNav.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg">
          <nav className="flex flex-col p-4">
            <a href="/" className="py-2">홈</a>
            <a href="/admin" className="py-2">관리자</a>
          </nav>
        </div>
      )}
    </div>
  );
}
```

---

## Step 8-2: Framer Motion 애니메이션

### 스크롤 애니메이션

```typescript
'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function AnimatedSection({ children }: any) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
```

### 페이지 전환

#### `frontend/app/layout.tsx`
```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: any) {
  const pathname = usePathname();

  return (
    <html>
      <body>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </body>
    </html>
  );
}
```

### 숫자 카운터 애니메이션

```typescript
'use client';

import { useEffect, useState } from 'react';

export function CountUp({ end }: { end: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end]);

  return <span>{count}</span>;
}
```

---

## Step 8-3: 로딩 상태

### Skeleton UI

```typescript
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}
```

### Loading Spinner

```typescript
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
    </div>
  );
}
```

---

## ✅ Phase 8 완료

```bash
git push origin feature/phase-8-responsive-animation
```

**다음**: [Phase 9 - 배포 준비](./phase-9.md)
