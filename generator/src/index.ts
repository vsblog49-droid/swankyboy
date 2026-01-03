import 'dotenv/config';
import { generateArticle } from './content-generator';
import { logGeneration } from './database';

import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
}

async function main() {
  console.log('🚀 SwankyBoyz Content Generator');
  console.log('================================\n');
  
  const startTime = Date.now();
  
  try {
    const topic = process.env.TOPIC;
    const category = process.env.CATEGORY;
    
    const result = await generateArticle({ topic, category });
    
    const generationTime = Date.now() - startTime;
    
    console.log('\n✅ Generation Complete!');
    console.log(`📝 Title: ${result.article.title}`);
    console.log(`🔗 Slug: ${result.article.slug}`);
    console.log(`📦 Products: ${result.products.length}`);
    console.log(`⏱️  Time: ${generationTime}ms`);
    
    await logGeneration({
      trigger: 'automated',
      topic: result.article.title,
      articleId: result.article.id,
      productsFeatured: result.products.length,
      generationTimeMs: generationTime,
      success: true
    });
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error);
    if (process.env.SENTRY_DSN) Sentry.captureException(error);
    
    await logGeneration({
      trigger: 'automated',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    if (process.env.SENTRY_DSN) await Sentry.flush(2000);
    process.exit(1);
  }
}

main();
