import type { Product } from './types';

export function scoreProductRelevance(
  product: Product,
  topic: string,
  keywords: string[]
): number {
  let score = 0;
  
  const text = `${product.title} ${product.description}`.toLowerCase();
  const topicLower = topic.toLowerCase();
  
  // Keyword matching
  keywords.forEach(kw => {
    if (text.includes(kw.toLowerCase())) score += 10;
  });
  
  // Topic relevance
  const topicWords = topicLower.split(/\s+/).filter(w => w.length > 4);
  topicWords.forEach(word => {
    if (text.includes(word)) score += 5;
  });
  
  // Quality signals
  score += Math.min(product.rating * 10, 50);
  score += Math.min(product.reviewCount / 10, 30);
  if (product.isPrime) score += 10;
  if (product.isAmazonChoice) score += 15;
  if (product.isBestSeller) score += 20;
  
  // Price sweet spot
  if (product.price >= 25 && product.price <= 200) score += 10;
  
  return score;
}

export function curateProducts(products: Product[], maxCount: number): Product[] {
  // Ensure price diversity
  const budget = products.filter(p => p.price < 50);
  const mid = products.filter(p => p.price >= 50 && p.price < 150);
  const premium = products.filter(p => p.price >= 150);
  
  const selected: Product[] = [];
  
  // Pick from each tier
  if (budget.length > 0) selected.push(budget[0]);
  if (mid.length > 0) selected.push(...mid.slice(0, 2));
  if (premium.length > 0) selected.push(premium[0]);
  
  // Fill remaining slots with top-rated
  const remaining = products
    .filter(p => !selected.includes(p))
    .slice(0, maxCount - selected.length);
  
  return [...selected, ...remaining].slice(0, maxCount);
}
