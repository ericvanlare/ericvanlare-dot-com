import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /repo-name/, Cloudflare Pages from /
  base: process.env.GITHUB_PAGES ? '/ericvanlare-dot-com/' : '/',
})
