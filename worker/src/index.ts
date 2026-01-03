import { handleArticles } from './handlers/articles';
import { handleProducts } from './handlers/products';
import { handleAnalytics } from './handlers/analytics';
import { handleHealth } from './handlers/health';
import { corsHeaders } from './lib/cors';
import { handleAdminProducts } from './handlers/admin';

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Routes
      if (url.pathname === '/health') {
        return handleHealth(env);
      }
      
      if (url.pathname.startsWith('/articles')) {
        return handleArticles(request, env);
      }
      
      if (url.pathname.startsWith('/products')) {
        return handleProducts(request, env);
      }

      // Admin product management (protected by ADMIN_TOKEN binding)
      if (url.pathname.startsWith('/admin/products')) {
        return handleAdminProducts(request, env);
      }
      
      if (url.pathname.startsWith('/analytics')) {
        return handleAnalytics(request, env);
      }
      
      return jsonResponse({ error: 'Not found' }, 404);
      
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  }
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
