import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['vite/modulepreload-polyfill'],
  },
  build: {
    rollupOptions: {
      external: ['vite/modulepreload-polyfill'],
    },
  },
})
