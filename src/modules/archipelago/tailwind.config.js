/** @type {import('tailwindcss').Config} */
// Config Tailwind dédiée à la page autonome archipelago.html (servie sous /pages/archipelago.html)
// et chargée via `@config` depuis archipelago.css. Chemins relatifs à ce fichier.
export default {
  content: { relative: true, files: ['./archipelago.html'] },
  theme: { extend: {} },
  plugins: [],
}
