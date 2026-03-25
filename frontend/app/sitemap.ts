import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dreammechaniclab.com';

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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
    // API 실패 시 정적 페이지만 반환
  }

  return [...staticPages, ...blogPages];
}
