import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import type { Product } from '../generator/src/types';
import { saveProducts } from '../generator/src/database';

async function run() {
  const seedPath = path.resolve(__dirname, '../generator/config/seed_products.json');
  const raw = fs.readFileSync(seedPath, 'utf8');
  const items = JSON.parse(raw) as Array<any>;

  // Normalize to Product shape used by saveProducts
  const products: Product[] = items.map(i => ({
    asin: i.asin,
    title: i.title,
    brand: i.brand || null,
    category: i.category || 'lifestyle',
    price: i.price || 0,
    currency: i.currency || 'USD',
    imageUrl: i.imageUrl || '',
    additionalImages: i.additionalImages || [],
    description: i.description || i.notes || '',
    features: i.features || [],
    specifications: i.specifications || {},
    affiliateUrl: i.affiliateUrl,
    detailPageUrl: i.detailPageUrl || i.affiliateUrl,
    rating: i.rating || 0,
    reviewCount: i.reviewCount || 0,
    isPrime: i.isPrime || false,
    isAmazonChoice: i.isAmazonChoice || false,
    isBestSeller: i.isBestSeller || false
  }));

  // If Cloudflare secrets are missing, write a SQL file for manual import
  const missing = !process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.D1_DATABASE_ID;
  if (missing) {
    console.warn('Cloudflare secrets not set — will emit SQL file instead of sending to D1.');
    const lines: string[] = [];
    for (const p of products) {
      const sql = `INSERT OR REPLACE INTO products (
  asin, title, brand, category, price, currency, image_url, description, features, affiliate_url, detail_page_url, rating, review_count, is_prime, is_amazon_choice, is_bestseller
) VALUES (${[
        `'${p.asin.replace(/'/g, "''")}'`,
        `'${p.title.replace(/'/g, "''")}'`,
        p.brand ? `'${p.brand.replace(/'/g, "''")}'` : 'NULL',
        `'${p.category.replace(/'/g, "''")}'`,
        p.price || 0,
        `'${p.currency}'`,
        `'${(p.imageUrl || '').replace(/'/g, "''")}'`,
        `'${(p.description || '').replace(/'/g, "''")}'`,
        `'${JSON.stringify(p.features || []).replace(/'/g, "''")}'`,
        `'${(p.affiliateUrl || '').replace(/'/g, "''")}'`,
        `'${(p.detailPageUrl || '').replace(/'/g, "''")}'`,
        p.rating || 0,
        p.reviewCount || 0,
        p.isPrime ? 1 : 0,
        p.isAmazonChoice ? 1 : 0,
        p.isBestSeller ? 1 : 0
      ].join(', ')});
`;
      lines.push(sql);
    }
    const out = path.resolve(process.cwd(), 'seed_products.sql');
    fs.writeFileSync(out, lines.join('\n'));
    console.log(`Wrote ${products.length} INSERT statements to ${out}. You can run them with: wrangler d1 execute <db-name> --file=seed_products.sql --remote`);
    return;
  }

  // Run the live import (requires generator database client to be configured)
  try {
    await saveProducts(products);
    console.log(`Imported ${products.length} products into D1`);
  } catch (err) {
    console.error('Failed to import into D1:', err);
    process.exit(1);
  }
}

run();
