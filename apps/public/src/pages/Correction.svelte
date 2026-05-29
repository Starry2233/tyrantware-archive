<script lang="ts">
import { vendors } from '@tyrantware/shared'
import { publicApi, messageOf } from '../lib/api'
import { setFlash } from '../lib/state.svelte'
import {
  isPureFrontend,
  buildCorrectionYaml,
  buildCorrectionFilename,
  buildPrUrl
} from '../lib/pure-frontend'

let form = $state({
  vendor: '',
  software_name: '',
  description: '',
  evidence_urls: '',
  license_agreement: false
})
let submitting = $state(false)

// Pure frontend PR prompt state
let prYaml = $state('')
let prFilename = $state('')
let prUrl = $state<string | null>(null)

const submit = async (event: SubmitEvent) => {
  event.preventDefault()

  if (isPureFrontend()) {
    prFilename = buildCorrectionFilename(form.vendor, form.software_name)
    prYaml = buildCorrectionYaml(form)
    prUrl = buildPrUrl(prFilename)
    return
  }

  submitting = true
  setFlash(null)
  try {
    await publicApi.correction({
      vendor: form.vendor,
      software_name: form.software_name,
      description: form.description,
      evidence_urls: form.evidence_urls,
      license_agreement: form.license_agreement ? 'yes' : 'no'
    })
    form = {
      vendor: '',
      software_name: '',
      description: '',
      evidence_urls: '',
      license_agreement: false
    }
    window.location.assign('/success?type=correction')
  } catch (error) {
    setFlash(messageOf('error', error instanceof Error ? error.message : '提交失败。'))
  } finally {
    submitting = false
  }
}
</script>

<svelte:head>
  <title>更正 - Tyrantware Archive</title>
</svelte:head>

<main class="single-panel">
  {#if prYaml}
    <div class="panel-header">
      <span class="eyebrow">Create Pull Request</span>
      <h1>创建 Pull Request</h1>
      <p>请通过 GitHub Pull Request 提交这条更正请求，管理员审核后处理。</p>
    </div>

    <section class="form-panel">
      <p>请在下方复制 YAML 内容，然后点击按钮在 GitHub 上创建新文件：</p>

      <pre class="yaml-preview">{prYaml}</pre>

      <p class="field-hint">
        文件名：<code>{prFilename}</code>
      </p>

      {#if prUrl}
        <a class="primary-button" href={prUrl} target="_blank" rel="noopener noreferrer">
          在 GitHub 上创建 Pull Request
        </a>
      {:else}
        <div class="note-panel">
          <p>请配置 VITE_GH_REPO 环境变量（例如 <code>your-user/tyrantware-archive</code>）以启用一键 PR 链接。</p>
        </div>
      {/if}

      <p class="field-hint">
        操作步骤：复制上方 YAML → 前往仓库的 <code>data/submissions/</code> 目录 →
        创建新文件 → 粘贴内容 → 提交 Pull Request
      </p>

      <button class="secondary-button" type="button" onclick={() => {
        prYaml = ''
        prFilename = ''
        prUrl = null
      }}>返回修改</button>
    </section>
  {:else}
    <div class="panel-header">
      <span class="eyebrow">Correction Request</span>
      <h1>更正请求</h1>
      <p>仅限已被收录进档案库的软件提交更正请求。管理员审核通过后，会自动移除对应档案记录。</p>
    </div>

    <form class="form-panel" onsubmit={submit}>
      <label>软件厂商
        <input bind:value={form.vendor} type="text" list="vendors-correction" placeholder="例如：微软、腾讯" required />
        <datalist id="vendors-correction">
          {#each vendors as vendor}
            <option value={vendor}></option>
          {/each}
        </datalist>
        <span class="field-hint">可选择常见厂商或自行输入</span>
      </label>

      <label>软件名称
        <input bind:value={form.software_name} type="text" placeholder="例如：Windows 11, iTunes, Chrome" required />
        <span class="field-hint">
          必须与档案库中的软件名称完全对应。
        </span>
      </label>

      <label>更正说明
        <textarea
          bind:value={form.description}
          rows="5"
          placeholder="说明为什么该记录是错误的，并补充必要上下文"
          required
        ></textarea>
      </label>

      <label>补充证据
        <textarea
          bind:value={form.evidence_urls}
          rows="3"
          placeholder="填写参考资料链接等证据来源"
          required
        ></textarea>
      </label>

      <label class="consent-check">
        <input bind:checked={form.license_agreement} type="checkbox" required />
        <span>
          我已认真阅读并同意《专有恶意软件档案库贡献协议》。
        </span>
      </label>

      <button class="primary-button" type="submit" disabled={submitting}>
        {submitting ? '提交中' : isPureFrontend() ? '生成更正内容' : '提交更正'}
      </button>
    </form>
  {/if}
</main>

<style>
  .yaml-preview {
    padding: 16px;
    background: #1c1a18;
    color: #e6e0d4;
    font-family: 'Courier New', monospace;
    font-size: 0.88rem;
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre;
    border: 1px solid rgba(241, 232, 217, 0.14);
  }

  .note-panel p {
    margin-bottom: 0;
  }
</style>
