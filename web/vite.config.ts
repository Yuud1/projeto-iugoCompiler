import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Aponta para o código do compilador no diretório pai.
      // Todos os módulos do compilador são TypeScript puro, sem APIs do Node.js,
      // então funcionam no browser via Vite sem nenhuma adaptação.
      '@compiler': path.resolve(__dirname, '../src/compiler'),
    },
  },
});
