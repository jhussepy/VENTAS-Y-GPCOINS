/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
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
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          surface2: 'var(--bg-surface2)',
          border: 'var(--bg-border)',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          soft: 'var(--fg-soft)',
          muted: 'var(--fg-muted)',
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
