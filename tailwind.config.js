/** @type {import('tailwindcss').Config} */
export default {
  // Neuvième Vie (JS brut, sans Tailwind) et Archipelago (sa propre config) sont exclus.
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    '!./src/modules/studio/jeux/neuvieme-vie/**',
    '!./src/modules/archipelago/**',
  ],
  theme: {
    extend: {
      colors: {
        // Persona design-system palette (also usable as Tailwind utilities)
        persona: {
          red: '#ec0016',
          'red-deep': '#b00010',
          black: '#0a0908',
          ink: '#121110',
          cream: '#fdf6ee',
          grey: '#8a8784',
        },
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body: ['Oswald', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
