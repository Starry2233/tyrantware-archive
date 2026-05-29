<script lang="ts">
import { vendors, malwareCategories } from '@tyrantware/shared'
import { publicApi, messageOf } from '../lib/api'
import { setFlash } from '../lib/state.svelte'
import {
  isPureFrontend,
  buildSubmissionYaml,
  buildSubmissionFilename,
  buildPrUrl
} from '../lib/pure-frontend'

let form = $state({
  vendor: '',
  software_name: '',
  malware_category: '',
  description: '',
  evidence_urls: '',
  license_agreement: false
})
let files = $state<FileList | null>(null)
let submitting = $state(false)

// Pure frontend PR prompt state
let prYaml = $state('')
let prFilename = $state('')
let prUrl = $state<string | null>(null)

const submit = async (event: SubmitEvent) => {
  event.preventDefault()
  const formElement = event.currentTarget
  if (!(formElement instanceof HTMLFormElement)) return

  if (isPureFrontend()) {
    prFilename = buildSubmissionFilename(form.vendor, form.software_name)
    prYaml = buildSubmissionYaml(form)
    prUrl = buildPrUrl(prFilename)
    return
  }

  submitting = true
  setFlash(null)

  const body = new FormData()
  body.set('vendor', form.vendor)
  body.set('software_name', form.software_name)
  body.set('malware_category', form.malware_category)
  body.set('description', form.description)
  body.set('evidence_urls', form.evidence_urls)
  body.set('license_agreement', form.license_agreement ? 'yes' : 'no')
  for (const file of files ? [...files] : []) body.append('images', file)

  try {
    await publicApi.submit(body)
    form = {
      vendor: '',
      software_name: '',
      malware_category: '',
      description: '',
      evidence_urls: '',
      license_agreement: false
    }
    files = null
    formElement.reset()
    window.location.assign('/success?type=submission')
  } catch (error) {
    setFlash(messageOf('error', error instanceof Error ? error.message : '提交失败。'))
  } finally {
    submitting = false
  }
}
</script>

<svelte:head>
  <title>提交 - Tyrantware Archive</title>
</svelte:head>

<main class="single-panel">
  {#if prYaml}
    <div class="panel-header">
      <span class="eyebrow">Create Pull Request</span>
      <h1>创建 Pull Request</h1>
      <p>请通过 GitHub Pull Request 提交这条恶意软件记录，管理员审核后合并。</p>
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
      <span class="eyebrow">Evidence Submission</span>
      <h1>提交恶意软件证据</h1>
      <p>
        请围绕专有软件的恶意行为填写事实经过。审核通过后，厂商、软件名称、恶意行为类别与描述会被正式记录。
      </p>
      {#if isPureFrontend()}
        <div class="note-panel" style="margin-top: 16px;">
          <p>当前为纯前端模式（GitHub Pages），提交后需要创建 Pull Request 来添加记录。</p>
        </div>
      {/if}
    </div>

    <form class="form-panel" onsubmit={submit}>
      <label>软件厂商
        <input bind:value={form.vendor} type="text" list="vendors-submit" placeholder="例如：微软、腾讯" required />
        <datalist id="vendors-submit">
          {#each vendors as vendor}
            <option value={vendor}></option>
          {/each}
        </datalist>
        <span class="field-hint">可选择常见厂商或自行输入</span>
      </label>

      <label>软件名称
        <input
          bind:value={form.software_name}
          type="text"
          placeholder="例如：Windows 11, iTunes, Chrome"
          required
        />
      </label>

      <label>恶意行为类别
        <select bind:value={form.malware_category} required>
          <option value="">请选择</option>
          {#each malwareCategories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </label>

      <label>行为描述
        <textarea
          bind:value={form.description}
          rows="5"
          placeholder="详述该软件的恶意行为——它如何侵犯用户权益、收集哪些数据、存在哪些限制或后门等"
          required
        ></textarea>
      </label>

      <label>证据来源
        <textarea
          bind:value={form.evidence_urls}
          rows="3"
          placeholder="填入参考资料链接、新闻报道、研究论文 URL 或其他证据来源"
          required
        ></textarea>
      </label>

      <label>补充图片证据
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onchange={(event) => (files = (event.currentTarget as HTMLInputElement).files)}
        />
        <span class="field-hint">
          可上传最多 4 张图片，支持 JPG、PNG、WEBP、GIF，单张不超过 5MB。纯前端模式下图片不会随 YAML 提交。
        </span>
      </label>

      <label class="consent-check">
        <input bind:checked={form.license_agreement} type="checkbox" required />
        <span>
          我已认真阅读并同意《专有恶意软件档案库贡献协议》。
        </span>
      </label>

      <button class="primary-button" type="submit" disabled={submitting}>
        {submitting ? '提交中' : isPureFrontend() ? '生成提交内容' : '提交'}
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
