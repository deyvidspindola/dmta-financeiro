import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  // Publicado em $WEB_ROOT/app/ (mesmo document root da API, subpasta —
  // ver docs/02_CI_CD.md e deploy-web.yml), não na raiz do domínio.
  // Sem isso o build referencia /assets/... (raiz) em vez de
  // /app/assets/..., e todo asset 404 (cai no roteador da API).
  base: '/app/',
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
