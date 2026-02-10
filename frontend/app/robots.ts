import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://dreammechaniclab.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/owner/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
