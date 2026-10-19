import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  server: {
    port: 5173,
    // Khi chạy dev, mọi yêu cầu /api chuyển sang server Node ở cổng 5174
    proxy: { '/api': 'http://localhost:5174' },
    fs: { allow: ['..'] },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
