import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const paths = [
    '',
    'blog',
    ...(await getCollection('pages')).map((p) => p.data.path),
    ...(await getCollection('news')).map((p) => p.data.path),
  ];
  const urls = paths.map((p) => new URL(encodeURI(`/${p ? `${p}/` : ''}`), site).href).sort();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
