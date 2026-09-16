import path from 'path';
import { defineConfig } from 'vite';


export default defineConfig({
  base: '/clearmed-ai/',
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
