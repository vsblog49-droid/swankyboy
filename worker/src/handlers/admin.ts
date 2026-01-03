import { jsonResponse } from '../lib/response';
import type { Env } from '../index';
import { structuredLog } from '../lib/monitor';

export async function handleAdminProducts(request: Request, env: Env): Promise<Response> {
  // Simple admin routes for managing products. Requires an admin token header: x-admin-token
  const token = request.headers.get('x-admin-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/, '');
  if (!token || token !== (env as any).ADMIN_TOKEN) {
    structuredLog('warn', 'Unauthorized admin attempt', { path: new URL(request.url).pathname });
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(request.url);
  const pathname = url.pathname.replace('/admin/products', '');

  // Toggle feature for a product: POST /admin/products/:asin/feature with JSON { action: 'on'|'off', priority?: number }
  if (request.method === 'POST' && pathname.startsWith('/')) {
    const parts = pathname.split('/').filter(Boolean);
    const asin = parts[0];
    const actionPath = parts[1];

    if (!asin || actionPath !== 'feature') {
      return jsonResponse({ error: 'Invalid admin path' }, 400);
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action === 'off' ? 'off' : 'on';
    const priority = typeof body.priority === 'number' ? body.priority : (action === 'on' ? 1 : 0);

    if (action === 'on') {
      await env.DB.prepare(`UPDATE products SET is_featured = 1, featured_at = datetime('now'), featured_priority = ? WHERE asin = ?`).bind(priority, asin).run();
      structuredLog('info', 'Product featured', { asin, priority });
      return jsonResponse({ success: true });
    } else {
      await env.DB.prepare(`UPDATE products SET is_featured = 0, featured_at = NULL, featured_priority = 0 WHERE asin = ?`).bind(asin).run();
      structuredLog('info', 'Product unfeatured', { asin });
      return jsonResponse({ success: true });
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}
