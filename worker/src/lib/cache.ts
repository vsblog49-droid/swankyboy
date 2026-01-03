export async function getCache(key: string): Promise<Response | null> {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache/${key}`);
  return await cache.match(cacheKey);
}

export async function setCache(key: string, response: Response, ttlSeconds: number): Promise<void> {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache/${key}`);
  const cachedResponse = new Response(response.body, {
    ...response,
    headers: {
      ...Object.fromEntries(response.headers),
      'Cache-Control': `public, max-age=${ttlSeconds}`
    }
  });
  await cache.put(cacheKey, cachedResponse);
}
