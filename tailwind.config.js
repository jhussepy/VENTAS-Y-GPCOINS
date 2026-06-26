/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        vf: {
          red: '#E60000',
          redDark: '#B30000',
          redLight: '#FF4D4D',
        },
        gp: {
          gold: '#FFB81C',
          goldDark: '#D99700',
        },
        bg: {
          base: '#0A0A0F',
          surface: '#15151E',
          surface2: '#1E1E2A',
          border: '#2A2A38',
        },
      },
      fontFamily: {
        sans: ['Fira Sans', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
