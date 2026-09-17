import path from 'path';
import { defineConfig } from 'vite';


// Use '/clearmed-ai/' base only when building for GitHub Pages (CI env).
// Vercel and local dev both serve from '/'.
const isGithubPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  base: isGithubPages ? '/clearmed-ai/' : '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
