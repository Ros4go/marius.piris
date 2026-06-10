import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (CNAME) => served from the root, so base is '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
