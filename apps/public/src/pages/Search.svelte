<script lang="ts">
import { vendors, type SearchPayload } from '@tyrantware/shared'
import { publicApi, messageOf } from '../lib/api'
import { setFlash } from '../lib/state.svelte'
import { isPureFrontend } from '../lib/pure-frontend'

let vendor = $state('')
let softwareName = $state('')
let result = $state<SearchPayload | null>(null)
let loading = $state(false)

const submit = async (event: SubmitEvent) => {
  event.preventDefault()
  loading = true
  result = null
  setFlash(null)
  try {
    result = await publicApi.search(vendor, softwareName)
  } catch (error) {
    setFlash(messageOf('error', error instanceof Error ? error.message : '查询失败。'))
  } finally {
    loading = false
  }
}
</script>

<svelte:head>
  <title>查询 - Tyrantware Archive</title>
</svelte:head>

<main class="single-panel">
  <div class="panel-header">
    <span class="eyebrow">Archive Lookup</span>
    <h1>恶意软件查询</h1>
    <p>
      输入软件厂商和软件名称，检索已通过审核的专有软件恶意行为记录。
    </p>
    {#if isPureFrontend()}
      <div class="note-panel" style="margin-top: 16px;">
        <p>当前为纯前端模式，查询基于静态数据文件 <code>data/entries.json</code>，数据可能不是最新的。</p>
      </div>
    {/if}
  </div>

  <form class="form-panel compact" novalidate onsubmit={submit}>
    <label>软件厂商
      <input bind:value={vendor} type="text" list="vendors-search" placeholder="例如：微软、腾讯" required />
      <datalist id="vendors-search">
        {#each vendors as item}
          <option value={item}></option>
        {/each}
      </datalist>
    </label>

    <label>软件名称
      <input bind:value={softwareName} type="text" placeholder="例如：Windows 11, iTunes, Chrome" required />
    </label>

    <button class="primary-button" type="submit">
      {loading ? '查询中' : '开始查询'}
    </button>
  </form>

  {#if loading}
    <section class="result-panel api-result-panel">
      <h2>查询中</h2>
      <p>正在请求档案库，请稍候。</p>
    </section>
  {:else if result?.found && result.entry}
    <section class="result-panel api-result-panel danger">
      <h2>查询结果：已记录在案</h2>
      <dl>
        <div><dt>软件厂商</dt><dd>{result.entry.vendor}</dd></div>
        <div><dt>软件名称</dt><dd>{result.entry.software_name}</dd></div>
        <div><dt>恶意行为类别</dt><dd>{result.entry.malware_category}</dd></div>
        <div><dt>描述</dt><dd>{result.entry.description}</dd></div>
        <div><dt>证据来源</dt><dd>{result.entry.evidence_urls}</dd></div>
        <div><dt>录入时间</dt><dd>{result.entry.created_at}</dd></div>
        <div><dt>最后更新</dt><dd>{result.entry.updated_at}</dd></div>
      </dl>
      {#if result.entry.images.length}
        <div class="evidence-gallery">
          {#each result.entry.images as image}
            <a class="evidence-thumb" href={image.url} target="_blank" rel="noopener noreferrer">
              <span>{image.filename}</span>
            </a>
          {/each}
        </div>
      {/if}
    </section>
  {:else if result}
    <section class="result-panel api-result-panel safe">
      <h2>查询结果：未收录</h2>
      <p>
        档案库中当前没有 <strong>{result.query.vendor}</strong> 旗下软件
        <strong>{result.query.software_name}</strong> 的恶意行为记录。
      </p>
    </section>
  {/if}
</main>
