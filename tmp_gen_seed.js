const fs = require('fs');
const path = require('path');
const seedPath = path.resolve(__dirname, 'generator/config/seed_products.json');
const raw = fs.readFileSync(seedPath, 'utf8');
const items = JSON.parse(raw);
const products = items.map((i, idx) => ({
  asin: i.asin,
  title: i.title,
  brand: i.brand || null,
  category: i.category || 'lifestyle',
  price: i.price || 0,
  currency: i.currency || 'USD',
  imageUrl: i.imageUrl || '',
  description: i.description || i.notes || '',
  features: i.features || [],
  affiliateUrl: i.affiliateUrl,
  detailPageUrl: i.detailPageUrl || i.affiliateUrl,
  rating: i.rating || 0,
  reviewCount: i.reviewCount || 0,
  isPrime: i.isPrime || false,
  isAmazonChoice: i.isAmazonChoice || false,
  isBestSeller: i.isBestSeller || false,
  isFeatured: idx < 3,
  featuredAt: idx < 3 ? new Date().toISOString() : undefined,
  featuredPriority: idx < 3 ? (3 - idx) : 0
}));
const lines = [];
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
console.log(`Wrote ${products.length} INSERT statements to ${out}.`);
