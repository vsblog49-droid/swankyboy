import 'dotenv/config';
import { generateArticle } from './content-generator';

(async function run() {
  try {
    console.log('Running generator test (will use real APIs if configured)');
    const result = await generateArticle({});
    console.log('Title:', result.article.title);
    console.log('Products:', result.products.map(p => p.asin).join(', '));
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
