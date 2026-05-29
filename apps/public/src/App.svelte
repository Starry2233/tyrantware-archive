<script lang="ts">
import { Router, route } from '@mateothegreat/svelte5-router'
import { routes, routerConfig } from './routes'
import { flash } from './lib/state.svelte'

let sponsorOpen = $state(false)

const closeSponsor = () => {
  sponsorOpen = false
  document.body.classList.remove('modal-open')
}

const openSponsor = () => {
  sponsorOpen = true
  document.body.classList.add('modal-open')
}

const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && sponsorOpen) closeSponsor()
}
</script>

<svelte:head>
  <title>Tyrantware Archive - 专有恶意软件档案库</title>
</svelte:head>

<svelte:window on:keydown={onKey} />

<div class="page-shell">
  <header class="site-nav">
    <a class="site-brand" href="/" use:route>Tyrantware Archive</a>
    <nav class="site-links" aria-label="导航">
      <a class="nav-tab nav-button" href="/" use:route>首页</a>
      <a class="nav-tab nav-button" href="/search" use:route>查询</a>
      <a class="nav-tab nav-button" href="/all" use:route>全部</a>
      <a class="nav-tab nav-button" href="/submit" use:route>提交</a>
      <a class="nav-tab nav-button" href="/correction" use:route>更正</a>
    </nav>
  </header>

  {#if flash.item}
    <div class="flash-stack">
      <div class={`flash flash-${flash.item.kind}`}>
        {flash.item.message}
      </div>
    </div>
  {/if}

  <Router {routes} {...routerConfig} />
</div>
