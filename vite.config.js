import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/oprimiseur-mot-clef-seo/',
  build: {
    outDir: 'dist',
  }
})
