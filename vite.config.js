import { defineConfig } from 'vite';
import path from 'node:path';
import { readFileSync } from 'fs';

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  root: 'src/',
  base: './',

  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },

  server: {
    port: 3000,
    strictPort: true,
    open: false,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
});