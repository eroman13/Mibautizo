/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de colores tiernos para bautizo de gemelas
        'pastel-blue': '#A8D8EA',
        'pastel-pink': '#FFB3D9',
        'pastel-peach': '#FFD4A3',
        'pastel-lavender': '#E0BBE4',
        'soft-white': '#FEFEFE',
        'soft-gray': '#F5F5F5',
      },
      fontFamily: {
        'display': ['Georgia', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
