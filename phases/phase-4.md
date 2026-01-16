# Phase 4: 메인 페이지 개발

## 🎯 목표
히어로 섹션과 정비사 카드 그리드를 만들어 메인 페이지를 완성합니다.

---

## Step 4-1: 레이아웃 컴포넌트

### `frontend/components/Layout.tsx`
```typescript
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-black text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">정비사 찾기</h1>
        </div>
      </header>
      
      <main className="flex-1">{children}</main>
      
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 정비사 웹사이트</p>
        </div>
      </footer>
    </div>
  );
}
```

---

## Step 4-2: 히어로 섹션

### `frontend/components/HeroSection.tsx`
```typescript
'use client';

import { motion } from 'framer-motion';

export default function HeroSection({ totalMechanics, totalClicks }: any) {
  return (
    <section className="bg-gradient-to-br from-black to-gray-900 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold mb-6"
        >
          믿을 수 있는 정비사를
          <br />
          <span className="text-yellow-400">찾으세요</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-300 mb-12"
        >
          클릭 한 번으로 확인하는 검증된 정비소
        </motion.p>

        <div className="flex justify-center gap-12">
          <div>
            <div className="text-5xl font-bold text-yellow-400">
              {totalMechanics}
            </div>
            <div className="text-gray-400 mt-2">등록된 정비사</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-yellow-400">
              {totalClicks}
            </div>
            <div className="text-gray-400 mt-2">총 조회수</div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## Step 4-3: 정비사 카드

### `frontend/components/MechanicCard.tsx`
```typescript
'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Eye } from 'lucide-react';
import type { Mechanic } from '@/types';

interface Props {
  mechanic: Mechanic;
  onClick: () => void;
}

export default function MechanicCard({ mechanic, onClick }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
    >
      {/* 이미지 */}
      <div className="h-48 bg-gray-200">
        {mechanic.mainImageUrl ? (
          <img
            src={mechanic.mainImageUrl}
            alt={mechanic.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2">{mechanic.name}</h3>

        <div className="space-y-2 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{mechanic.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span>{mechanic.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye size={16} />
            <span className="font-semibold text-blue-600">
              조회수 {mechanic.clickCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## Step 4-4: 메인 페이지 통합

### `frontend/app/page.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { mechanicsApi } from '@/lib/api';
import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import MechanicCard from '@/components/MechanicCard';
import type { Mechanic } from '@/types';

export default function Home() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const { data } = await mechanicsApi.getAll();
        setMechanics(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMechanics();
  }, []);

  const totalClicks = mechanics.reduce((sum, m) => sum + m.clickCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  return (
    <Layout>
      <HeroSection
        totalMechanics={mechanics.length}
        totalClicks={totalClicks}
      />

      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">정비사 목록</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mechanics.map((mechanic) => (
            <MechanicCard
              key={mechanic.id}
              mechanic={mechanic}
              onClick={() => {
                // Phase 5에서 모달 열기 구현
                console.log('Open modal:', mechanic.id);
              }}
            />
          ))}
        </div>
      </section>
    </Layout>
  );
}
```

---

## ✅ Phase 4 완료

```bash
git push origin feature/phase-4-main-page
```

**다음**: [Phase 5 - 상세 모달](./phase-5.md)
