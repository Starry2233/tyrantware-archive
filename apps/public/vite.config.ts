import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: process.env.VITE_PURE_FRONTEND === 'true' ? '/tyrantware-archive/' : '/',
  define: process.env.VITE_PURE_FRONTEND === 'true'
    ? { 'import.meta.env.VITE_PURE_FRONTEND': JSON.stringify('true') }
    : undefined
})
