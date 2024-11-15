import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: {
        main: 'electron/main.ts',
        preload: 'electron/preload.ts'
      },
      // Automatically compiles TypeScript and enables HMR for Electron processes
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
})
