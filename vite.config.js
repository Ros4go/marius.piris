import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'

// PAGES AUTONOMES — tout ce qui n'est pas l'application React (index.html).
// Chaque élément vit dans le dossier de son module (src/modules/…) mais reste servi
// à son URL publique historique, en dev comme au build. Ajouter une page = une ligne.
//
//   html : page HTML traitée par Vite (CSS compilé, fichiers versionnés)
//   dir  : dossier copié tel quel (jeu en JavaScript brut, chemins relatifs)
const STANDALONE = [
  { url: '/pages/archipelago.html', html: 'src/modules/archipelago/archipelago.html' },
  { url: '/pages/guitare.html', html: 'src/modules/studio/outils/guitare/guitare.html' },
  { url: '/pages/generateur-emails.html', html: 'src/modules/studio/outils/generateur-emails/generateur-emails.html' },
  { url: '/games/neuvieme-vie/', dir: 'src/modules/studio/jeux/neuvieme-vie' },
]

const ROOT = process.cwd()
const PAGES = STANDALONE.filter((p) => p.html)
const DIRS = STANDALONE.filter((p) => p.dir)

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
}

function standalonePages() {
  return {
    name: 'standalone-pages',

    // Dev : /pages/x.html → le HTML du module ; /games/x/… → fichiers bruts du dossier.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [path, query = ''] = req.url.split('?')
        const page = PAGES.find((p) => p.url === path)
        if (page) {
          req.url = '/' + page.html + (query ? '?' + query : '')
          return next()
        }
        const d = DIRS.find((x) => path === x.url.slice(0, -1) || path.startsWith(x.url))
        if (!d) return next()
        if (path === d.url.slice(0, -1)) {
          res.statusCode = 301
          res.setHeader('Location', d.url)
          return res.end()
        }
        const base = resolve(ROOT, d.dir)
        let file = normalize(join(base, decodeURIComponent(path.slice(d.url.length))))
        if (file !== base && !file.startsWith(base + sep)) return next() // pas de sortie du dossier
        if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
        if (!existsSync(file)) return next()
        res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] || 'application/octet-stream')
        res.end(readFileSync(file))
      })
    },

    // Build : les HTML sortent à leur URL publique au lieu de dist/src/modules/…
    // (en « post », après que Vite a généré les HTML).
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        for (const page of PAGES) {
          const out = bundle[page.html]
          if (!out) this.error(`page autonome introuvable dans le build : ${page.html}`)
          const source = out.source
          delete bundle[page.html]
          this.emitFile({ type: 'asset', fileName: page.url.slice(1), source })
        }
      },
    },

    // Build : les dossiers bruts sont copiés tels quels.
    writeBundle(options) {
      for (const d of DIRS) cpSync(resolve(ROOT, d.dir), join(options.dir, d.url), { recursive: true })
    },
  }
}

// Custom domain (CNAME) => served from the root, so base is '/'.
export default defineConfig({
  base: '/',
  plugins: [react(), standalonePages()],
  // Le pré-scan des dépendances ne doit lire que les pages traitées par Vite
  // (pas le JS brut de Neuvième Vie).
  optimizeDeps: { entries: ['index.html', ...PAGES.map((p) => p.html)] },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        ...Object.fromEntries(PAGES.map((p) => [p.url.split('/').pop().replace('.html', ''), p.html])),
      },
    },
  },
})
