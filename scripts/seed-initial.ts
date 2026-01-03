import 'dotenv/config';
import { generateArticle } from '../generator/src/content-generator';
import { saveArticle, saveProducts } from '../generator/src/database';

// This script is a minimal seed that runs the generator locally using mocks or real APIs if you configure .env
(async function seed() {
  try {
    console.log('Seeding 3 sample articles...');
    for (let i = 0; i < 3; i++) {
      const result = await generateArticle({});
      console.log('Seeded:', result.article.title);
    }
    console.log('Done seeding');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
