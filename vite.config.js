import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.21.50:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/'),
      },
    },
  },
});
