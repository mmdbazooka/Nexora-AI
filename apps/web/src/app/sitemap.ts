import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return [
    '',
    'features',
    'solutions',
    'pricing',
    'about',
    'contact',
    'faq',
    'privacy',
    'terms',
  ].map((p) => ({ url: `${url}/${p}`, changeFrequency: 'monthly', priority: p === '' ? 1 : 0.7 }));
}
