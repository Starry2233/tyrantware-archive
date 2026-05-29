import { StatusCode } from '@mateothegreat/svelte5-router'
import NotFound from '@tyrantware/shared/NotFound.svelte'

export const routes = [
  { component: async () => import('./pages/Home.svelte') },
  { path: 'submit', component: async () => import('./pages/Submit.svelte') },
  { path: 'search', component: async () => import('./pages/Search.svelte') },
  { path: 'all', component: async () => import('./pages/All.svelte') },
  { path: 'correction', component: async () => import('./pages/Correction.svelte') },
  { path: 'success', component: async () => import('./pages/Success.svelte') }
]

export const routerConfig = {
  basePath: import.meta.env.BASE_URL || '/',
  statuses: {
    [StatusCode.NotFound]: () => ({
      component: NotFound,
      props: { target: '首页' }
    })
  }
}
