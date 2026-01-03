import axios from 'axios';
import type { Article, Product } from './types';

const D1_API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.D1_DATABASE_ID}/query`;

const headers = {
  'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
  'Content-Type': 'application/json'
};

export async function saveArticle(article: Omit<Article, 'id'>): Promise<Article> {
  const id = generateId();
  
  await d1Query(`
    INSERT INTO articles (
      id, slug, title, excerpt, content, markdown_content,
      category, meta_title, meta_description, keywords,
      product_asins, author, read_time_minutes, word_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    article.slug,
    article.title,
    article.excerpt,
    article.content,
    article.markdownContent,
    article.category,
    article.metaTitle,
    article.metaDescription,
    JSON.stringify(article.keywords),
    JSON.stringify(article.productAsins),
    article.author,
    article.readTimeMinutes,
    article.wordCount
  ]);
  
  return { id, ...article };
}

export async function saveProducts(products: Product[]): Promise<void> {
  for (const p of products) {
    await d1Query(`
      INSERT OR REPLACE INTO products (
        asin, title, brand, category, price, currency,
        image_url, description, features, affiliate_url,
        detail_page_url, rating, review_count, is_prime,
        is_amazon_choice, is_bestseller, is_featured, featured_at, featured_priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      p.asin, p.title, p.brand, p.category, p.price, p.currency,
      p.imageUrl, p.description, JSON.stringify(p.features),
      p.affiliateUrl, p.detailPageUrl, p.rating, p.reviewCount,
      p.isPrime ? 1 : 0, p.isAmazonChoice ? 1 : 0, p.isBestSeller ? 1 : 0,
      p.isFeatured ? 1 : 0, p.featuredAt || null, p.featuredPriority || 0
    ]);
  }
}

export async function logGeneration(log: any): Promise<void> {
  await d1Query(`
    INSERT INTO generation_log (
      trigger, topic, article_id, products_featured,
      generation_time_ms, success, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    log.trigger,
    log.topic || null,
    log.articleId || null,
    log.productsFeatured || null,
    log.generationTimeMs || null,
    log.success ? 1 : 0,
    log.errorMessage || null
  ]);
}

async function d1Query(sql: string, params: any[] = []): Promise<any> {
  const response = await axios.post(D1_API, {
    sql,
    params
  }, { headers });
  
  if (!response.data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(response.data.errors)}`);
  }
  
  return response.data.result[0];
}

function generateId(): string {
  return `art_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
