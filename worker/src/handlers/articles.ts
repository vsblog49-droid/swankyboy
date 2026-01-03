import { jsonResponse, getCached, setCache } from '../lib/response';
import type { Env } from '../index';

export async function handleArticles(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.pathname.split('/articles/')[1];
  
  // Single article
  if (slug) {
    return getArticle(slug, env);
  }
  
  // List articles
  const category = url.searchParams.get('category');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  return listArticles(category, limit, offset, env);
}

async function getArticle(slug: string, env: Env): Promise<Response> {
  const cacheKey = `article:${slug}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  
  const result = await env.DB.prepare(`
    SELECT * FROM articles WHERE slug = ? AND status = 'published'
  `).bind(slug).first();
  
  if (!result) {
    return jsonResponse({ error: 'Article not found' }, 404);
  }
  
  // Parse JSON fields
  const article = {
    ...result,
    keywords: JSON.parse(result.keywords as string || '[]'),
    productAsins: JSON.parse(result.product_asins as string || '[]')
  };
  
  // Get featured products
  if (article.productAsins.length > 0) {
    const products = await env.DB.prepare(`
      SELECT * FROM products WHERE asin IN (${article.productAsins.map(() => '?').join(',')})
    `).bind(...article.productAsins).all();
    
    article.products = products.results;
  }
  
  // Increment views
  await env.DB.prepare(`
    UPDATE articles SET views = views + 1 WHERE slug = ?
  `).bind(slug).run();
  
  const response = jsonResponse(article);
  await setCache(cacheKey, response, 3600);
  return response;
}

async function listArticles(
  category: string | null,
  limit: number,
  offset: number,
  env: Env
): Promise<Response> {
  const cacheKey = `articles:${category}:${limit}:${offset}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  
  let query = `
    SELECT id, slug, title, excerpt, category, cover_image,
           author, published_at, read_time_minutes, views
    FROM articles
    WHERE status = 'published'
  `;
  
  const params: any[] = [];
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  query += ` ORDER BY published_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const result = await env.DB.prepare(query).bind(...params).all();
  
  const response = jsonResponse({
    articles: result.results,
    pagination: {
      limit,
      offset,
      total: result.results.length
    }
  });
  
  await setCache(cacheKey, response, 1800);
  return response;
}
