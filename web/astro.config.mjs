import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://abdullahoztoprak.github.io',
  base: '/first-contribution-playground',
  integrations: [tailwind()],
  output: 'static',
  build: {
    assets: 'assets',
  },
});
