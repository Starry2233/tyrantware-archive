<script lang="ts">
import { route } from '@mateothegreat/svelte5-router'
</script>

<svelte:head>
  <title>Tyrantware Archive - 专有恶意软件档案库</title>
</svelte:head>

<main class="hero hero-home">
  <section class="hero-copy dossier">
    <div class="hero-label-row">
      <span class="eyebrow">Proprietary Malware Archive</span>
    </div>
    <h1>专有恶意软件档案库</h1>
    <p>
      本档案库收集、核验和公开检索专有软件中的恶意行为记录——包括监视、后门、DRM、欺诈、
      强制捆绑、成瘾性设计等各类侵害用户权益的行为。所有提交都经过人工复核后才会生效。
      本项目受 <a class="text-link" href="https://gnu.org/proprietary/" target="_blank" rel="noopener noreferrer">GNU 专有软件文档</a> 启发。
    </p>
    <div class="hero-metrics">
      <div>
        <span>流程</span>
        <strong>提交 → 审核 → 入档</strong>
      </div>
      <div>
        <span>原则</span>
        <strong>留痕、克制、可复核</strong>
      </div>
    </div>
  </section>

  <section class="mission-strip">
    <a class="mission-card" href="/submit" use:route>
      <span class="mission-index">01</span>
      <h2>提交证据</h2>
      <p>提交专有软件的恶意行为记录，包括厂商、软件名称、恶意行为类别、描述与证据来源，等待管理员审核。</p>
      <span class="text-link">进入提交</span>
    </a>
    <a class="mission-card" href="/search" use:route>
      <span class="mission-index">02</span>
      <h2>公开查询</h2>
      <p>按软件厂商与软件名称检索，快速确认某款软件是否已被记录在案。</p>
      <span class="text-link">进入查询</span>
    </a>
    <a class="mission-card" href="/correction" use:route>
      <span class="mission-index">03</span>
      <h2>更正请求</h2>
      <p>若档案库中存在错误记录，可提交更正请求与补充证据，经复核后处理。</p>
      <span class="text-link">进入更正</span>
    </a>
  </section>

  <section class="home-bottom-grid">
    <article class="note-panel">
      <span class="eyebrow">行为分类</span>
      <h2>覆盖的恶意行为类型</h2>
      <p>监视 · 后门 · DRM · 诈骗 · 欺骗 · 强制 · 成瘾 · 审查 · 掩盖 · 不兼容 · 不安全 · 干扰 · 监狱 · 操纵 · 过时 · 破坏 · 订阅 · 束缚 · 独裁</p>
    </article>
    <article class="quote-panel">
      <span class="eyebrow">本站立场</span>
      <p>
        专有软件（Proprietary Software）是指那些剥夺用户控制权的软件。
        本档案库致力于记录这些软件侵害用户权益的行为，推动自由软件运动。
      </p>
    </article>
  </section>
</main>
