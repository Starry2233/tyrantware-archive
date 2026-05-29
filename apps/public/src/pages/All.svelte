<script lang="ts">
import { loadStaticEntries } from '../lib/pure-frontend'
import type { MalwareEntry } from '@tyrantware/shared'

let entries = $state<MalwareEntry[]>([])
let loading = $state(true)

const load = async () => {
  loading = true
  const base = import.meta.env.BASE_URL || '/'
  const all = await loadStaticEntries(base)
  entries = all.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  loading = false
}

$effect(load)
</script>

<svelte:head>
  <title>全部记录 - Tyrantware Archive</title>
</svelte:head>

<main class="single-panel">
  <div class="panel-header">
    <span class="eyebrow">Full Archive</span>
    <h1>全部记录</h1>
    <p>档案库中所有已收录的专有软件恶意行为记录，按录入时间倒序排列。</p>
  </div>

  {#if loading}
    <section class="result-panel api-result-panel">
      <p>加载中…</p>
    </section>
  {:else if entries.length === 0}
    <section class="result-panel api-result-panel safe">
      <h2>档案库为空</h2>
      <p>暂无收录任何记录。</p>
    </section>
  {:else}
    <section class="result-panel api-result-panel">
      <p class="field-hint" style="margin-bottom: 16px;">
        共 {entries.length} 条记录
      </p>
      {#each entries as entry, i}
        <article class="timeline-entry" class:last={i === entries.length - 1}>
          <time class="timeline-time">{entry.created_at?.slice(0, 10)}</time>
          <div class="timeline-body">
            <h3>
              <span class="entry-vendor">{entry.vendor}</span>
              <span class="entry-sep">/</span>
              <span class="entry-name">{entry.software_name}</span>
            </h3>
            <span class="category-tag">{entry.malware_category}</span>
            <p class="entry-desc">{entry.description}</p>
            {#if entry.evidence_urls}
              <p class="field-hint">
                证据：<a href={entry.evidence_urls} target="_blank" rel="noopener noreferrer">{entry.evidence_urls}</a>
              </p>
            {/if}
          </div>
        </article>
      {/each}
    </section>
  {/if}
</main>

<style>
  .timeline-entry {
    display: flex;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(241, 232, 217, 0.1);
  }

  .timeline-entry.last {
    border-bottom: none;
  }

  .timeline-time {
    flex-shrink: 0;
    width: 88px;
    font-size: 0.82rem;
    color: #a09888;
    font-family: 'Courier New', monospace;
    padding-top: 2px;
  }

  .timeline-body {
    flex: 1;
    min-width: 0;
  }

  .timeline-body h3 {
    margin: 0 0 6px;
    font-size: 1.05rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .entry-vendor {
    color: #e6e0d4;
  }

  .entry-sep {
    color: #6b6358;
  }

  .entry-name {
    color: #d4a76a;
  }

  .category-tag {
    display: inline-block;
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 3px;
    background: rgba(212, 167, 106, 0.15);
    color: #d4a76a;
    margin-bottom: 8px;
  }

  .entry-desc {
    margin: 0 0 4px;
    font-size: 0.88rem;
    line-height: 1.6;
    color: #c8c0b4;
  }
</style>
