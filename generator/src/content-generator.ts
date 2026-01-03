import OpenAI from 'openai';
import { searchAmazonProducts } from './amazon-client';
import { curateProducts, scoreProductRelevance } from './product-curator';
import { optimizeSEO } from './seo-optimizer';
import { saveArticle, saveProducts } from './database';
import niche from '../config/niche.json';
import type { Article, Product, NicheConfig } from './types';

// Use OpenAI only when API key provided; allow a safe mock mode for local development
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface GenerationOptions {
  topic?: string;
  category?: string;
}

interface GenerationResult {
  article: Article;
  products: Product[];
}

export async function generateArticle(
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  console.log('📝 Step 1: Generate topic');
  const topic = options.topic || await generateTopic(options.category);
  console.log(`   → Topic: ${topic}\n`);
  
  console.log('🔍 Step 2: Search for products');
  const products = await curateProductsForTopic(topic, options.category);
  console.log(`   → Found ${products.length} products\n`);
  
  if (products.length < 3) {
    throw new Error('Insufficient quality products found');
  }
  
  console.log('✍️  Step 3: Generate content');
  const articleContent = await generateArticleContent(topic, products);
  console.log(`   → ${articleContent.wordCount} words\n`);
  
  console.log('🔧 Step 4: Optimize SEO');
  const seoData = await optimizeSEO(articleContent, topic);
  console.log(`   → Meta optimized\n`);
  
  console.log('💾 Step 5: Save to database');
  const article = await saveArticle({
    ...articleContent,
    ...seoData,
    productAsins: products.map(p => p.asin)
  });
  
  await saveProducts(products);
  console.log(`   → Saved article and ${products.length} products\n`);
  
  return { article, products };
}

async function generateTopic(category?: string): Promise<string> {
  const targetCategory = category || selectRandomCategory();
  const categoryConfig = (niche as NicheConfig).categories[targetCategory];

  // If OpenAI isn't configured, return a lightweight mock topic for local dev/testing
  if (!openai) {
    return `Mock topic: Best ${categoryConfig.name} picks`;
  }
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert content strategist for ${niche.niche.name}.\n\nTarget audience:\n- Age: ${niche.niche.target_audience.age}\n- Income: ${niche.niche.target_audience.income}\n- Interests: ${niche.niche.target_audience.interests.join(', ')}\n\nPain points:\n${niche.niche.target_audience.pain_points.map(p => `- ${p}`).join('\n')}\n\nGenerate topics that:\n1. Solve real problems\n2. Provide genuine value FIRST\n3. Allow natural product recommendations\n4. Have search intent and commercial value\n5. Are evergreen\n\nTone: ${niche.content_strategy.tone}`
      },
      {
        role: 'user',
        content: `Generate ONE article topic for "${categoryConfig.name}".\n\nKeywords: ${categoryConfig.keywords.join(', ')}\n\nReturn ONLY the topic title.`
      }
    ],
    temperature: 0.9,
    max_tokens: 100
  });
  
  return completion.choices[0].message.content?.trim() || 'Default Topic';
}

async function curateProductsForTopic(
  topic: string,
  category?: string
): Promise<Product[]> {
  const keywords = extractKeywords(topic, category);
  const allProducts: Product[] = [];
  
  for (const keyword of keywords) {
    console.log(`   → Searching: ${keyword}`);
    const results = await searchAmazonProducts(keyword, {
      minRating: niche.content_strategy.product_integration.quality_threshold.min_rating,
      minReviews: niche.content_strategy.product_integration.quality_threshold.min_reviews,
      maxResults: 20
    });
    allProducts.push(...results);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }
  
  const uniqueProducts = Array.from(
    new Map(allProducts.map(p => [p.asin, p])).values()
  );
  
  const scored = uniqueProducts
    .map(product => ({
      product,
      score: scoreProductRelevance(product, topic, keywords)
    }))
    .sort((a, b) => b.score - a.score);
  
  const selected = curateProducts(
    scored.map(s => s.product),
    niche.content_strategy.product_integration.max_per_article
  );
  
  selected.forEach(p => {
    console.log(`   ✓ ${p.title.substring(0, 50)}... - $${p.price} (${p.rating}⭐)`);
  });
  
  return selected;
}

async function generateArticleContent(
  topic: string,
  products: Product[]
): Promise<Omit<Article, 'id' | 'metaTitle' | 'metaDescription' | 'keywords' | 'coverImage'>> {
  // Mock fallback when OpenAI isn't configured (safe local dev)
  if (!openai) {
    const markdown = `# ${topic}\n\nA short mock article about ${topic}.\n\n## Products\n${products.map(p => `- **${p.title}** — $${p.price} — ${p.rating}⭐`).join('\n')}`;
    const title = extractTitle(markdown);
    const slug = generateSlug(title);
    const excerpt = generateExcerpt(markdown);
    const category = categorizeContent(markdown);
    const wordCount = markdown.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    return {
      slug,
      title,
      excerpt,
      content: processMarkdown(markdown, products),
      markdownContent: markdown,
      category,
      productAsins: products.map(p => p.asin),
      author: 'SwankyBoyz Editorial',
      readTimeMinutes: readTime,
      wordCount
    };
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert writer for ${niche.niche.name}.\n\nCRITICAL RULES:\n1. EDUCATION FIRST (60% educational, 40% products)\n2. Provide REAL value - help readers even if they don't buy\n3. Natural product mentions - never pushy\n4. Conversational yet authoritative\n5. Honest pros and cons\n\nStructure:\n- Engaging hook\n- Problem identification\n- Educational content\n- Product solutions\n- Actionable takeaways\n\nTone: ${niche.content_strategy.tone}\n\nProduct Integration:\n- Mention as solutions to problems\n- Explain WHY each works\n- Compare honestly\n- Include pros/cons\n- Use "I recommend", "consider", "worth checking out"\n\nLength: 2000-3000 words`
      },
      {
        role: 'user',
        content: `Write about: ${topic}\n\nProducts to recommend:\n${products.map((p, i) => `\n${i + 1}. ${p.title}\n   Price: $${p.price}\n   Rating: ${p.rating}/5 (${p.reviewCount} reviews)\n   ${p.isPrime ? '✓ Prime' : ''}\n   ${p.isAmazonChoice ? '✓ Amazon\'s Choice' : ''}\n   Features: ${p.features?.slice(0, 3).join('; ') || 'N/A'}\n`).join('\n')}\n\nFormat: Markdown with H2/H3 headings, bullets, bold sparingly.\nMark products as [Product Name] for linking.`
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });
  
  const markdown = completion.choices[0].message.content || '';
  const title = extractTitle(markdown);
  const slug = generateSlug(title);
  const excerpt = generateExcerpt(markdown);
  const category = categorizeContent(markdown);
  const wordCount = markdown.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  
  return {
    slug,
    title,
    excerpt,
    content: processMarkdown(markdown, products),
    markdownContent: markdown,
    category,
    productAsins: products.map(p => p.asin),
    author: 'SwankyBoyz Editorial',
    readTimeMinutes: readTime,
    wordCount
  };
}

function extractKeywords(topic: string, category?: string): string[] {
  const categoryConfig = category ? (niche as NicheConfig).categories[category] : null;
  const baseKeywords = categoryConfig?.keywords || [];
  const topicWords = topic
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4);
  
  return [...new Set([...baseKeywords, ...topicWords])].slice(0, 5);
}

function processMarkdown(markdown: string, products: Product[]): string {
  let processed = markdown;
  
  products.forEach(product => {
    const regex = new RegExp(`\\[${escapeRegex(product.title)}\\]`, 'gi');
    processed = processed.replace(
      regex,
      `[${product.title}](#product-${product.asin})`
    );
  });
  
  return processed;
}

function selectRandomCategory(): string {
  const categories = Object.keys((niche as NicheConfig).categories);
  return categories[Math.floor(Math.random() * categories.length)];
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Untitled Article';
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60);
}

function generateExcerpt(markdown: string): string {
  const text = markdown
    .replace(/^#+\s+.+$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_]/g, '')
    .trim();
  
  return text.substring(0, 160) + '...';
}

function categorizeContent(markdown: string): string {
  const text = markdown.toLowerCase();
  
  for (const [key, config] of Object.entries((niche as NicheConfig).categories)) {
    const matches = config.keywords.filter(kw => text.includes(kw.toLowerCase()));
    if (matches.length >= 2) return key;
  }
  
  return 'lifestyle';
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
