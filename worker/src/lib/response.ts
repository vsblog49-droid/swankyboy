import { corsHeaders } from './cors';

export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

export async function getCached(key: string): Promise<Response | null> {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache/${key}`);
  return await cache.match(cacheKey);
}

export async function setCache(key: string, response: Response, ttl: number): Promise<void> {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache/${key}`);
  const cachedResponse = new Response(response.body, {
    ...response,
    headers: {
      ...Object.fromEntries(response.headers),
      'Cache-Control': `public, max-age=${ttl}`
    }
  });
  await cache.put(cacheKey, cachedResponse);
}
