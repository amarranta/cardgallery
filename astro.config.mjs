import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// Configure base for GitHub Project Pages (served under /cardgallery)
export default defineConfig({
  base: '/cardgallery/',
  output: 'static',
  integrations: [tailwind(), react()]
});
