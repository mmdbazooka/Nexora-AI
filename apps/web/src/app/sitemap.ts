import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';
export default function sitemap(): MetadataRoute.Sitemap {
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
  ].map((p) => ({
    url: `${siteUrl}/${p}`,
    changeFrequency: 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));
}
