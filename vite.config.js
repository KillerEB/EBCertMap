import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { staticContentPlugin } from './scripts/static-content-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), staticContentPlugin()],
})
