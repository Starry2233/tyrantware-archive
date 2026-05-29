import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: '/tyrantware-archive/',
  define: {
    'import.meta.env.VITE_PURE_FRONTEND': JSON.stringify('true')
  }
})
