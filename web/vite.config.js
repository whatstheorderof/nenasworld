import { defineConfig } from 'vite';

// Link previews need the full address of the preview image. Set SITE_URL (for example
// https://nenasworld.com); on Vercel the project's production address is used automatically.
const site = () => (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')).replace(/\/$/, '');

export default defineConfig({
  server: { fs: { allow: ['..'] } },
  build: { rollupOptions: { input: { main: 'index.html', world: 'world.html' } } },   // world.html: the world diary for her creator
  plugins: [{ name: 'site-url', transformIndexHtml: html => html.replaceAll('%SITE_URL%', site()) }],
});
