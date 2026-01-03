import 'dotenv/config';
import { generateArticle } from './content-generator';
import { logGeneration } from './database';

async function main() {
  try {
    const result = await generateArticle({});
    console.log('Seed generation:', result.article.title);
    await logGeneration({
      trigger: 'seed',
      topic: result.article.title,
      articleId: result.article.id,
      productsFeatured: result.products.length,
      generationTimeMs: 0,
      success: true
    });
  } catch (err) {
    console.error('Seed failed:', err);
    await logGeneration({ trigger: 'seed', success: false, errorMessage: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
}

main();
