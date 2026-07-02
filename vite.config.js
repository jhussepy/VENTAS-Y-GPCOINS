import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // Separa las librerías pesadas en chunks propios: se descargan en
        // paralelo y el navegador las cachea entre despliegues (solo cambia
        // el chunk de la app, no el de firebase/react).
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
