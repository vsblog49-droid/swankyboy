import { jsonResponse } from '../lib/response';
import type { Env } from '../index';

export async function handleProducts(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const asin = url.pathname.split('/products/')[1];

  if (asin) {
    const result = await env.DB.prepare(`SELECT * FROM products WHERE asin = ?`).bind(asin).first();
    if (!result) return jsonResponse({ error: 'Product not found' }, 404);
    return jsonResponse(result);
  }

  // list products
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const result = await env.DB.prepare(`
    SELECT asin, title, brand, price, image_url, rating, review_count, in_stock
    FROM products
    ORDER BY times_featured DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return jsonResponse({ products: result.results });
}
