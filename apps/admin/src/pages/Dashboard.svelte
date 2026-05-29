<script lang="ts">
import { onMount } from 'svelte'
import { adminApi, messageOf } from '../lib/api'
import { isAuthed, setAuth } from '../lib/auth.svelte'
import { setFlash } from '../lib/state.svelte'
import { malwareCategories, type DashboardPayload } from '@tyrantware/shared'

let data = $state<DashboardPayload | null>(null)
let loading = $state(true)

const load = async () => {
  if (!isAuthed()) {
    window.location.assign('/')
    return
  }
  loading = true
  try {
    data = await adminApi.dashboard()
  } catch (error) {
    setFlash(messageOf('error', error instanceof Error ? error.message : '加载失败。'))
    if (!isAuthed()) window.location.assign('/')
  } finally {
    loading = false
  }
}

const run = async (task: Promise<string>) => {
  try {
    setFlash(messageOf('success', await task))
    await load()
  } catch (error) {
    setFlash(messageOf('error', error instanceof Error ? error.message : '操作失败。'))
  }
}

const logout = async () => {
  try {
    await adminApi.logout()
  } finally {
    setAuth(null)
    window.location.assign('/')
  }
}

onMount(() => {
  load()
})
</script>

<svelte:head>
  <title>后台管理 - Tyrantware Archive</title>
</svelte:head>

{#if loading}
  <main class="admin-layout">
    <div class="empty-state">加载中。</div>
  </main>
{:else if data}
  <main class="admin-layout">
    <header class="admin-header dossier">
      <div>
        <span class="eyebrow">审核与档案维护</span>
        <h1>后台管理页</h1>
        <p class="header-copy">
          这里处理恶意软件提交、更正请求与档案记录。通过审核后，记录会自动增删，不需要手动同步。
        </p>
      </div>
      <div class="admin-controls">
        <button class="secondary-button" type="button" onclick={logout}>退出登录</button>
      </div>
    </header>

    <section class="admin-section">
      <div class="section-title">
        <h2>待审核提交</h2>
        <span>{data.submissions.length} 条</span>
      </div>
      {#if data.submissions.length}
        <div class="review-grid">
          {#each data.submissions as submission}
            <article class="review-card">
              <h3>#{submission.id} {submission.vendor} / {submission.software_name}</h3>
              <div class="meta-strip">
                <span class="badge badge-danger">{submission.malware_category}</span>
                <span>{submission.created_at}</span>
              </div>
              <p><strong>恶意行为类别：</strong>{submission.malware_category}</p>
              <p><strong>描述：</strong>{submission.description}</p>
              <p><strong>证据来源：</strong>{submission.evidence_urls}</p>
              {#if submission.images.length}
                <div class="evidence-gallery">
                  {#each submission.images as image}
                    <a class="evidence-thumb" href={image.url} target="_blank" rel="noopener noreferrer">
                      <img src={image.url} alt={image.filename} />
                      <span>{image.filename}</span>
                    </a>
                  {/each}
                </div>
              {/if}
              <label>
                恶意行为类别
                <select name="malware_category" required form={`approve-submission-${submission.id}`}>
                  {#each malwareCategories as category}
                    <option value={category} selected={category === submission.malware_category}>{category}</option>
                  {/each}
                </select>
              </label>
              <div class="action-row">
                <form
                  id={`approve-submission-${submission.id}`}
                  onsubmit={(event) => {
                    event.preventDefault()
                    const form = new FormData(event.currentTarget as HTMLFormElement)
                    run(
                      adminApi.approveSubmission(
                        submission.id,
                        String(form.get('admin_note') || ''),
                        String(form.get('malware_category') || '')
                      )
                    )
                  }}
                >
                  <textarea name="admin_note" rows="2" placeholder="审核备注（可选）"></textarea>
                  <button class="primary-button" type="submit">通过并加入档案库</button>
                </form>
                <form
                  onsubmit={(event) => {
                    event.preventDefault()
                    const form = new FormData(event.currentTarget as HTMLFormElement)
                    run(adminApi.rejectSubmission(submission.id, String(form.get('admin_note') || '')))
                  }}
                >
                  <textarea name="admin_note" rows="2" placeholder="驳回原因（可选）"></textarea>
                  <button class="danger-button" type="submit">驳回</button>
                </form>
              </div>
            </article>
          {/each}
        </div>
      {:else}
        <div class="empty-state">当前没有待审核提交。</div>
      {/if}
    </section>

    <section class="admin-section">
      <div class="section-title">
        <h2>待审核更正请求</h2>
        <span>{data.corrections.length} 条</span>
      </div>
      {#if data.corrections.length}
        <div class="review-grid">
          {#each data.corrections as correction}
            <article class="review-card">
              <h3>#{correction.id} {correction.vendor} / {correction.software_name}</h3>
              <div class="meta-strip">
                <span class="badge">更正请求</span>
                <span>{correction.created_at}</span>
              </div>
              <p><strong>说明：</strong>{correction.description}</p>
              <p><strong>证据来源：</strong>{correction.evidence_urls}</p>
              <div class="action-row">
                <form
                  onsubmit={(event) => {
                    event.preventDefault()
                    const form = new FormData(event.currentTarget as HTMLFormElement)
                    run(adminApi.approveCorrection(correction.id, String(form.get('admin_note') || '')))
                  }}
                >
                  <textarea name="admin_note" rows="2" placeholder="审核备注（可选）"></textarea>
                  <button class="primary-button" type="submit">通过并移出档案库</button>
                </form>
                <form
                  onsubmit={(event) => {
                    event.preventDefault()
                    const form = new FormData(event.currentTarget as HTMLFormElement)
                    run(adminApi.rejectCorrection(correction.id, String(form.get('admin_note') || '')))
                  }}
                >
                  <textarea name="admin_note" rows="2" placeholder="驳回原因（可选）"></textarea>
                  <button class="danger-button" type="submit">驳回</button>
                </form>
              </div>
            </article>
          {/each}
        </div>
      {:else}
        <div class="empty-state">当前没有待审核更正请求。</div>
      {/if}
    </section>

    <section class="admin-section">
      <div class="section-title">
        <h2>当前档案库</h2>
        <span>{data.malwareEntries.length} 条</span>
      </div>
      {#if data.malwareEntries.length}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>厂商</th>
                <th>软件名称</th>
                <th>恶意行为类别</th>
                <th>描述</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {#each data.malwareEntries as entry}
                <tr>
                  <td>{entry.id}</td>
                  <td>{entry.vendor}</td>
                  <td>{entry.software_name}</td>
                  <td>{entry.malware_category}</td>
                  <td>
                    <div>{entry.description}</div>
                    {#if entry.images.length}
                      <div class="evidence-gallery evidence-gallery-inline">
                        {#each entry.images as image}
                          <a
                            class="evidence-thumb"
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img src={image.url} alt={image.filename} />
                            <span>{image.filename}</span>
                          </a>
                        {/each}
                      </div>
                    {/if}
                  </td>
                  <td>{entry.updated_at}</td>
                  <td>
                    <form
                      class="table-action-form"
                      onsubmit={(event) => {
                        event.preventDefault()
                        if (confirm('确认删除这条档案记录吗？')) {
                          run(adminApi.removeEntry(entry.id))
                        }
                      }}
                    >
                      <button class="danger-button" type="submit">删除</button>
                    </form>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="empty-state">档案库当前为空。</div>
      {/if}
    </section>
  </main>
{/if}
