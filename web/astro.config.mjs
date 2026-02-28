import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://abdullahoztoprak.github.io',
  base: '/Platform',
  integrations: [tailwind()],
  output: 'static',
  build: {
    assets: 'assets',
  },
});
