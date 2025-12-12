import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        /^@material\/web\/.*/, // Ignora tudo que começa com @material/web/
        /^chart\.js\/.*/,      // Ignora tudo que começa com chart.js/
      ]
    }
  }
});
