import * as url from 'node:url'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false
  },
  server: {
    fs: { allow: [url.fileURLToPath(new URL('.', import.meta.url))] }
  },
  plugins: [solid()]
})
