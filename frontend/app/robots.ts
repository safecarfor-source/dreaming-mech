import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://dreammechaniclab.com';

  const defaultDisallow = ['/admin/', '/owner/'];

  return {
    rules: [
      // 기본: 모든 크롤러 허용
      {
        userAgent: '*',
        allow: '/',
        disallow: defaultDisallow,
      },
      // 네이버 Yeti 크롤러 - 명시적 허용
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: defaultDisallow,
      },
      // === AI 크롤러 (AEO: Answer Engine Optimization) ===
      // OpenAI - ChatGPT 학습 및 검색
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: defaultDisallow,
      },
      // OpenAI - ChatGPT 검색 전용
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: defaultDisallow,
      },
      // OpenAI - ChatGPT 사용자 검색
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: defaultDisallow,
      },
      // Anthropic - Claude
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: defaultDisallow,
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: defaultDisallow,
      },
      // Perplexity AI 검색
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: defaultDisallow,
      },
      // Google - Gemini 학습
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: defaultDisallow,
      },
      // Apple - Apple Intelligence
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: defaultDisallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
