import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'gh-pages-spa',
      apply: 'build',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      }
    }
  ],
  base: process.env.VITE_PURE_FRONTEND === 'true' ? '/tyrantware-archive/' : '/',
  define: process.env.VITE_PURE_FRONTEND === 'true'
    ? { 'import.meta.env.VITE_PURE_FRONTEND': JSON.stringify('true') }
    : undefined
})
