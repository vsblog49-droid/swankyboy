const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.swankyboyz.com';

export async function getArticles(category?: string) {
  const url = new URL(`${API_URL}/articles`);
  if (category) url.searchParams.set('category', category);
  
  const response = await fetch(url.toString());
  return response.json();
}

export async function getArticle(slug: string) {
  const response = await fetch(`${API_URL}/articles/${slug}`);
  return response.json();
}

export async function trackClick(articleId: string, productAsin: string, context: string) {
  await fetch(`${API_URL}/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'click',
      articleId,
      productAsin,
      context
    })
  });
}
