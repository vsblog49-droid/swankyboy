import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  site: 'https://swankyboyz.com',
  integrations: [tailwind()],
  build: {
    inlineStylesheets: 'auto'
  }
});
