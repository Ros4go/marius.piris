import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// Copies chair content JSON files next to the built HTML so fetch() finds them.
function copyChairContent() {
  return {
    name: 'chair-content',
    closeBundle() {
      const src  = resolve(__dirname, 'src/modules/games/chair/content');
      const dest = resolve(__dirname, 'dist/src/modules/games/chair/content');
      if (!fs.existsSync(src)) return;
      fs.mkdirSync(dest, { recursive: true });
      for (const f of fs.readdirSync(src))
        fs.copyFileSync(resolve(src, f), resolve(dest, f));
    },
  };
}

// Custom domain (CNAME) => served from the root, so base is '/'.
export default defineConfig({
  base: '/',
  plugins: [react(), copyChairContent()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:  resolve(__dirname, 'index.html'),
        chair: resolve(__dirname, 'src/modules/games/chair/index.html'),
        // l'Atelier (outil de dev) + son sandbox (iframe) — accessibles en ligne
        atelier: resolve(__dirname, 'src/modules/games/chair/tools/organ-editor.html'),
        sandbox: resolve(__dirname, 'src/modules/games/chair/tools/view-sandbox.html'),
      },
    },
  },
})
