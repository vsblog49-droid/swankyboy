import { jsonResponse } from '../lib/response';
import type { Env } from '../index';

export async function handleAnalytics(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  
  const data = await request.json() as any;
  
  if (data.event === 'click') {
    return trackClick(data, env);
  }
  
  if (data.event === 'view') {
    return trackView(data, env);
  }
  
  return jsonResponse({ error: 'Invalid event' }, 400);
}

async function trackClick(data: any, env: Env): Promise<Response> {
  const { articleId, productAsin, context } = data;
  
  // Insert click event
  await env.DB.prepare(`
    INSERT INTO click_events (id, article_id, product_asin, click_context, clicked_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(
    `click_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    articleId,
    productAsin,
    context || 'unknown'
  ).run();
  
  // Update article clicks
  await env.DB.prepare(`
    UPDATE articles SET clicks = clicks + 1 WHERE id = ?
  `).bind(articleId).run();
  
  // Update product clicks
  await env.DB.prepare(`
    UPDATE products SET total_clicks = total_clicks + 1 WHERE asin = ?
  `).bind(productAsin).run();
  
  return jsonResponse({ success: true });
}

async function trackView(data: any, env: Env): Promise<Response> {
  const { articleId } = data;
  
  await env.DB.prepare(`
    UPDATE articles SET views = views + 1 WHERE id = ?
  `).bind(articleId).run();
  
  return jsonResponse({ success: true });
}
