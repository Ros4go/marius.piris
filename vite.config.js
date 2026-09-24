import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (CNAME) => served from the root, so base is '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Pages HTML autonomes passées par le build (Tailwind compilé, assets hashés).
      // Le chemin d'entrée est conservé en sortie : pages/archipelago.html
      // -> dist/pages/archipelago.html, donc l'URL /pages/archipelago.html ne change pas.
      // Les pages de public/pages/ restent copiées telles quelles, sans traitement.
      input: {
        main: 'index.html',
        archipelago: 'pages/archipelago.html',
      },
    },
  },
})
