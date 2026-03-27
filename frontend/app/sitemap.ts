import type { MetadataRoute } from 'next';
import { generateSlug } from '@/lib/slug';
import { getUniqueSidos, ALL_REGIONS, SIDO_SHORT_NAMES } from '@/lib/regions';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dreammechaniclab.com';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // 정적 페이지 (기존)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/for-mechanics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/inquiry`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // 블로그 글 동적 페이지
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/blog/articles?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const { data } = await res.json();
      blogPages = data.map(
        (article: { slug: string; publishedAt: string }) => ({
          url: `${baseUrl}/blog/${article.slug}`,
          lastModified: new Date(article.publishedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }),
      );
    }
  } catch {
    // API 실패 시 빈 배열로 처리
  }

  // 정비소 상세 페이지
  let shopPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiUrl}/mechanics?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const mechanics: Array<{ location: string; name: string }> =
        json.data || json;
      shopPages = mechanics.map((m) => ({
        url: `${baseUrl}/shop/${generateSlug(m.location || '', m.name)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // API 실패 시 빈 배열로 처리
  }

  // 지역별 랜딩 페이지 — 시도
  const sidoPages: MetadataRoute.Sitemap = getUniqueSidos().map((sido) => ({
    url: `${baseUrl}/region/${encodeURIComponent(SIDO_SHORT_NAMES[sido] || sido)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // 지역별 랜딩 페이지 — 시군구
  const sigunguPages: MetadataRoute.Sitemap = ALL_REGIONS.map((r) => ({
    url: `${baseUrl}/region/${encodeURIComponent(SIDO_SHORT_NAMES[r.sido] || r.sido)}/${encodeURIComponent(r.sigungu)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...blogPages, ...shopPages, ...sidoPages, ...sigunguPages];
}
