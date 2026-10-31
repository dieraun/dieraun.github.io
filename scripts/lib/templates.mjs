/**
 * 页面模板
 * ------------------------------------------------------------
 * 所有页面共用一个 layout，页面函数只负责拼装 <main> 内容。
 * 这样改页头、页脚、SEO 只需要动一个地方。
 */
import {
  absoluteUrl,
  escapeAttr,
  escapeHtml,
  formatDate,
  jsonForScript,
  withBase,
} from "./utils.mjs";
import { renderToc } from "./markdown.mjs";

const ICONS = {
  sun: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path></svg>`,
  moon: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.8A8.4 8.4 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"></path></svg>`,
  system: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none"></path></svg>`,
  arrowUp: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 19V5M6 11l6-6 6 6"></path></svg>`,
  arrowRight: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>`,
  arrowLeft: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M19 12H5M11 18l-6-6 6-6"></path></svg>`,
  github: `<svg class="icon icon--fill" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"></path></svg>`,
  mail: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3.5 6.5 8.5 6 8.5-6"></path></svg>`,
  rss: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="5.5" cy="18.5" r="1.6" fill="currentColor" stroke="none"></circle><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"></path></svg>`,
  clock: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 1.8"></path></svg>`,
  chart: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 19V5M4 19h16"></path><path d="M8 15v-4M12 15V7M16 15v-6M20 15V9"></path></svg>`,
  video: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m10 9 5 3-5 3V9Z"></path></svg>`,
  box: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"></path><path d="m4 7.5 8 4.5 8-4.5M12 12v9"></path></svg>`,
  monitor: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path></svg>`,
};

export function createTemplates(site, basePath) {
  const url = (path) => withBase(basePath, path);
  const absolute = (path) => absoluteUrl(site.url, basePath, path);
  const year = new Date().getFullYear();

  const navLink = (item, activeNav) => {
    const current = item.key === activeNav ? ' aria-current="page"' : "";
    return `<a class="site-nav__link" href="${url(item.href)}"${current}>${escapeHtml(item.label)}</a>`;
  };

  const themeToggle = () => `
    <button class="theme-toggle" type="button" data-theme-toggle aria-label="切换主题：自动">
      <span class="theme-toggle__icons" aria-hidden="true">
        <span class="theme-toggle__icon theme-toggle__icon--system">${ICONS.system}</span>
        <span class="theme-toggle__icon theme-toggle__icon--light">${ICONS.sun}</span>
        <span class="theme-toggle__icon theme-toggle__icon--dark">${ICONS.moon}</span>
      </span>
      <span class="theme-toggle__label" data-theme-label>自动</span>
    </button>`;

  const header = (activeNav) => `
    <header class="site-header" data-header>
      <div class="container site-header__inner">
        <a class="brand" href="${url("/")}" aria-label="${escapeAttr(site.title)} 首页">
          <span class="brand__mark" aria-hidden="true">${escapeHtml(site.mark)}</span>
          <span class="brand__text">${escapeHtml(site.title)}</span>
        </a>
        <nav class="site-nav" id="site-nav" data-nav aria-label="主导航">
          ${site.nav.map((item) => navLink(item, activeNav)).join("")}
        </nav>
        <div class="site-header__actions">
          ${themeToggle()}
          <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav" aria-label="打开菜单">
            <span class="menu-toggle__bars" aria-hidden="true"><span></span><span></span></span>
          </button>
        </div>
      </div>
    </header>`;

  const footer = () => `
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <div class="site-footer__brand">
          <p class="site-footer__title">${escapeHtml(site.title)}</p>
          <p class="site-footer__note">${escapeHtml(site.footerNote)}</p>
        </div>
        <div class="site-footer__links">
          <a href="${url("/posts/")}">文章</a>
          <a href="https://github.com/${escapeAttr(site.author.github)}" rel="me noopener noreferrer">GitHub ${ICONS.github}</a>
          <a href="${url("/feed.xml")}">RSS ${ICONS.rss}</a>
          <a href="mailto:${escapeAttr(site.author.email)}">邮箱 ${ICONS.mail}</a>
        </div>
      </div>
      <div class="container site-footer__bottom">
        <p>© ${year} ${escapeHtml(site.author.name)}</p>
        <p>由 Markdown 与一点原生 JavaScript 驱动</p>
      </div>
    </footer>`;

  const layout = ({
    title,
    description = site.description,
    canonicalPath = "/",
    activeNav = "",
    bodyClass = "",
    mainClass = "",
    content,
    scripts = [],
    noindex = false,
    ogType = "website",
    publishedTime = "",
    modifiedTime = "",
    jsonLd = null,
  }) => {
    const fullTitle = title ? `${title} · ${site.title}` : `${site.title} · ${site.tagline}`;
    const canonical = absolute(canonicalPath);
    const ogImage = absolute(site.ogImage);

    const articleMeta = [
      publishedTime
        ? `<meta property="article:published_time" content="${escapeAttr(publishedTime)}">`
        : "",
      modifiedTime
        ? `<meta property="article:modified_time" content="${escapeAttr(modifiedTime)}">`
        : "",
    ]
      .filter(Boolean)
      .join("\n    ");

    const jsonLdScript = jsonLd
      ? `<script type="application/ld+json">${jsonForScript(jsonLd)}</script>`
      : "";

    const scriptTags = ["/assets/js/main.js", ...scripts]
      .map((script) => `<script src="${url(script)}" defer></script>`)
      .join("\n    ");

    return `<!DOCTYPE html>
<html lang="${escapeAttr(site.locale)}" data-theme="light" data-theme-mode="system">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${escapeAttr(description)}">
    <meta name="author" content="${escapeAttr(site.author.name)}">
    <meta name="generator" content="SU2 static blog">
    <meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow"}">
    <link rel="canonical" href="${escapeAttr(canonical)}">
    <meta name="theme-color" content="${escapeAttr(site.theme.light)}" data-theme-color data-light="${escapeAttr(site.theme.light)}" data-dark="${escapeAttr(site.theme.dark)}">

    <meta property="og:type" content="${escapeAttr(ogType)}">
    <meta property="og:site_name" content="${escapeAttr(site.title)}">
    <meta property="og:title" content="${escapeAttr(fullTitle)}">
    <meta property="og:description" content="${escapeAttr(description)}">
    <meta property="og:url" content="${escapeAttr(canonical)}">
    <meta property="og:image" content="${escapeAttr(ogImage)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escapeAttr(site.description)}">
    <meta property="og:locale" content="zh_CN">
    ${articleMeta}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeAttr(fullTitle)}">
    <meta name="twitter:description" content="${escapeAttr(description)}">
    <meta name="twitter:image" content="${escapeAttr(ogImage)}">
    <meta name="twitter:image:alt" content="${escapeAttr(site.description)}">

    <link rel="icon" href="${url("/favicon.svg")}" type="image/svg+xml">
    <link rel="apple-touch-icon" sizes="180x180" href="${url("/apple-touch-icon.png")}">
    <link rel="alternate" type="application/rss+xml" title="${escapeAttr(site.title)}" href="${url("/feed.xml")}">
    <link rel="stylesheet" href="${url("/assets/css/main.css")}">
    <script>
      (function () {
        var root = document.documentElement;
        root.classList.add("js");
        try {
          var stored = localStorage.getItem("su2-theme");
          var mode = stored === "light" || stored === "dark" ? stored : "system";
          var dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
          root.dataset.theme = dark ? "dark" : "light";
          root.dataset.themeMode = mode;
          root.style.colorScheme = dark ? "dark" : "light";

          // 让移动端浏览器地址栏跟随手动主题，而不仅是系统主题
          var themeColor = document.querySelector("meta[data-theme-color]");
          if (themeColor) {
            themeColor.setAttribute(
              "content",
              dark ? themeColor.dataset.dark : themeColor.dataset.light,
            );
          }
        } catch (error) {
          root.dataset.theme = "light";
          root.dataset.themeMode = "system";
          var fallbackColor = document.querySelector("meta[data-theme-color]");
          if (fallbackColor) {
            fallbackColor.setAttribute("content", fallbackColor.dataset.light);
          }
        }
      })();
    </script>
    ${jsonLdScript}
  </head>
  <body class="${escapeAttr(bodyClass)}">
    <a class="skip-link" href="#main">跳到正文</a>
    ${header(activeNav)}
    <main class="site-main ${escapeAttr(mainClass)}" id="main">
      ${content}
    </main>
    ${footer()}
    <button class="to-top" type="button" data-to-top aria-label="回到顶部" hidden>
      ${ICONS.arrowUp}
    </button>
    ${scriptTags}
  </body>
</html>`;
  };

  const tagLinks = (tags) =>
    tags
      .map(
        (tag) =>
          `<a class="tag" href="${url(`/tags/?tag=${encodeURIComponent(tag)}`)}">#${escapeHtml(tag)}</a>`,
      )
      .join("");

  const postCard = (
    post,
    { dataTags = false, headingLevel = 3 } = {},
  ) => {
    const heading = headingLevel === 2 ? "h2" : "h3";
    return `
    <article class="post-card"${dataTags ? ` data-post-tags="${escapeAttr(JSON.stringify(post.tags))}"` : ""}>
      <div class="post-card__top">
        <time class="post-card__date" datetime="${formatDate(post.date, "iso")}">${formatDate(post.date, "short")}</time>
        <span class="post-card__reading">${post.readingMinutes} 分钟</span>
      </div>
      <${heading} class="post-card__title"><a href="${url(post.url)}">${escapeHtml(post.title)}</a></${heading}>
      <p class="post-card__summary">${escapeHtml(post.summary)}</p>
      <div class="post-card__footer">
        <div class="tag-list">${tagLinks(post.tags)}</div>
        <span class="post-card__arrow" aria-hidden="true">${ICONS.arrowRight}</span>
      </div>
    </article>`;
  };

  const projectCard = (project, index) => {
    const repoUrl = `https://github.com/${site.author.github}/${project.repo}`;
    const tags = Array.isArray(project.tags) ? project.tags : [];
    const icon = ICONS[project.icon] || ICONS.chart;

    return `
    <article class="project-card">
      <div class="project-card__top">
        <span class="project-card__index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
        <span class="project-card__icon" aria-hidden="true">${icon}</span>
      </div>
      <p class="project-card__kicker">
        <span>${escapeHtml(project.kicker)}</span>
        <code>${escapeHtml(site.author.github)}/${escapeHtml(project.repo)}</code>
      </p>
      <h3 class="project-card__title"><a href="${escapeAttr(repoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.title)}</a></h3>
      <p class="project-card__description">${escapeHtml(project.description)}</p>
      <div class="project-card__usage">
        <p class="project-card__usage-label">快速开始</p>
        <p class="project-card__usage-text">${escapeHtml(project.usage)}</p>
        <code class="project-card__command"><span>git clone https://github.com/${escapeHtml(site.author.github)}/${escapeHtml(project.repo)}.git</span><span>${escapeHtml(project.command)}</span></code>
      </div>
      <div class="project-card__footer">
        <div class="tag-list">
          ${tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}
        </div>
        <a class="project-card__repo" href="${escapeAttr(repoUrl)}" target="_blank" rel="noopener noreferrer" aria-label="在 GitHub 查看 ${escapeAttr(project.repo)}">
          查看仓库 ${ICONS.arrowRight}
        </a>
      </div>
    </article>`;
  };

  const home = ({ posts, tags }) => {
    const projects = Array.isArray(site.projects) ? site.projects : [];
    const projectCount = String(projects.length).padStart(2, "0");

    const projectsBlock = projects.length
      ? `
      <section class="section projects" id="projects" aria-labelledby="projects-title">
        <div class="section__head projects__head">
          <div class="projects__heading">
            <p class="eyebrow">Open Source · ${projectCount}</p>
            <h2 class="section__title" id="projects-title">最近在做的开源项目</h2>
            <p class="projects__intro">几个小工具，解决真实工作里反复出现的问题。都可以单独 clone、运行。</p>
          </div>
          <div class="projects__links">
            <a class="text-link" href="https://github.com/${escapeAttr(site.author.github)}?tab=repositories" target="_blank" rel="noopener noreferrer">全部仓库 ${ICONS.arrowRight}</a>
            <a class="text-link" href="${url("/posts/")}">技术文章 ${ICONS.arrowRight}</a>
          </div>
        </div>
        <div class="project-grid">
          ${projects.map((project, index) => projectCard(project, index)).join("")}
        </div>
      </section>`
      : "";

    return `
      <section class="hero">
        <div class="container hero__inner">
          <div class="hero__content">
            <p class="eyebrow hero__eyebrow">${escapeHtml(site.hero.eyebrow)}</p>
            <h1 class="hero__title">${site.hero.titleLines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}</h1>
            <p class="hero__description">${escapeHtml(site.hero.description)}</p>
            <div class="hero__actions">
              <a class="button button--primary" href="${url("/#projects")}">查看项目 ${ICONS.arrowRight}</a>
              <a class="button button--ghost" href="${url("/about/")}">关于我</a>
            </div>
            <dl class="hero__stats">
              <div><dt>开源项目</dt><dd>${projectCount}</dd></div>
              <div><dt>技术文章</dt><dd>${posts.length}</dd></div>
              <div><dt>标签</dt><dd>${tags.length}</dd></div>
            </dl>
          </div>
          <div class="hero__art" aria-hidden="true">
            <img src="${url("/assets/images/reading-scale.svg")}" alt="" width="420" height="420" loading="eager" decoding="async">
          </div>
        </div>
      </section>

      <div class="container">
        ${projectsBlock}
      </div>`;
  };

  const postList = ({ posts }) => {
    const byYear = new Map();
    for (const post of posts) {
      const yearKey = post.date.slice(0, 4);
      if (!byYear.has(yearKey)) byYear.set(yearKey, []);
      byYear.get(yearKey).push(post);
    }

    const groups = [...byYear.entries()]
      .map(
        ([yearKey, items]) => `
        <section class="archive-year" aria-labelledby="year-${yearKey}">
          <h2 class="archive-year__title" id="year-${yearKey}">${yearKey}</h2>
          <ol class="archive-list">
            ${items
              .map(
                (post) => `
              <li class="archive-item">
                <time class="archive-item__date" datetime="${formatDate(post.date, "iso")}">${formatDate(post.date, "short")}</time>
                <div class="archive-item__body">
                  <h3 class="archive-item__title"><a href="${url(post.url)}">${escapeHtml(post.title)}</a></h3>
                  <p class="archive-item__summary">${escapeHtml(post.summary)}</p>
                  <div class="archive-item__meta">
                    <div class="tag-list">${tagLinks(post.tags)}</div>
                    <span class="meta-dot" aria-hidden="true">·</span>
                    <span>${post.readingMinutes} 分钟</span>
                  </div>
                </div>
                <span class="archive-item__arrow" aria-hidden="true">${ICONS.arrowRight}</span>
              </li>`,
              )
              .join("")}
          </ol>
        </section>`,
      )
      .join("");

    return `
      <div class="container">
        <header class="page-head">
          <p class="eyebrow">Archive</p>
          <h1 class="page-head__title">全部文章</h1>
          <p class="page-head__description">共 ${posts.length} 篇。按时间排列，慢慢读。</p>
        </header>
        <div class="archive">${groups}</div>
      </div>`;
  };

  const post = ({ post: article, prev, next }) => {
    const toc = renderToc(article.headings);
    const published = formatDate(article.date, "long");

    const neighbor = (target, direction) => {
      if (!target) return "";
      const label = direction === "prev" ? "上一篇" : "下一篇";
      const icon = direction === "prev" ? ICONS.arrowLeft : ICONS.arrowRight;
      return `
        <a class="post-nav__link post-nav__link--${direction}" href="${url(target.url)}">
          <span class="post-nav__label">${label}</span>
          <span class="post-nav__title">${escapeHtml(target.title)}</span>
          ${icon}
        </a>`;
    };

    return `
      <div class="container container--post">
        <article class="post">
          <header class="post__header">
            <a class="back-link" href="${url("/posts/")}">${ICONS.arrowLeft} 全部文章</a>
            <div class="tag-list post__tags">${tagLinks(article.tags)}</div>
            <h1 class="post__title">${escapeHtml(article.title)}</h1>
            <p class="post__summary">${escapeHtml(article.summary)}</p>
            <div class="post__meta">
              <time datetime="${formatDate(article.date, "iso")}">${published}</time>
              <span class="meta-dot" aria-hidden="true">·</span>
              <span>${ICONS.clock} 约 ${article.readingMinutes} 分钟</span>
            </div>
          </header>

          <div class="post__layout${toc ? "" : " post__layout--single"}">
            ${
              toc
                ? `<aside class="post__aside">
                    <details class="toc-panel" open>
                      <summary class="toc-panel__summary">目录</summary>
                      ${toc}
                    </details>
                  </aside>`
                : ""
            }
            <div class="post__body prose">
              ${article.html}
            </div>
          </div>

          <footer class="post__footer">
            <div class="post__footer-tags">
              <span class="post__footer-label">标签</span>
              <div class="tag-list">${tagLinks(article.tags)}</div>
            </div>
            ${
              prev || next
                ? `<nav class="post-nav" aria-label="文章导航">
                    ${neighbor(prev, "prev")}
                    ${neighbor(next, "next")}
                  </nav>`
                : ""
            }
          </footer>
        </article>
      </div>`;
  };

  const tags = ({ posts, tagCounts }) => {
    const sortedTags = [...tagCounts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"),
    );

    return `
      <div class="container">
        <header class="page-head">
          <p class="eyebrow">Index</p>
          <h1 class="page-head__title">标签</h1>
          <p class="page-head__description">按主题浏览。选择一个标签，筛选出相关的文章。</p>
        </header>

        <div class="tag-filter" data-tag-filter-group>
          <button class="tag-filter__button is-active" type="button" data-tag-filter="" aria-pressed="true">全部 <span>${posts.length}</span></button>
          ${sortedTags
            .map(
              ([tag, count]) =>
                `<button class="tag-filter__button" type="button" data-tag-filter="${escapeAttr(tag)}" aria-pressed="false">${escapeHtml(tag)} <span>${count}</span></button>`,
            )
            .join("")}
        </div>

        <p class="tag-filter__status" data-tag-status aria-live="polite">共 ${posts.length} 篇</p>

        <div class="post-grid post-grid--tags" data-tag-posts>
          ${posts.map((item) => postCard(item, { dataTags: true, headingLevel: 2 })).join("")}
        </div>

        <p class="tag-filter__empty" data-tag-empty hidden>没有找到这个标签下的文章。</p>
        <noscript><p class="tag-filter__status">启用 JavaScript 后可以按标签筛选。</p></noscript>
      </div>`;
  };

  const about = ({ page }) => `
    <div class="container container--about">
      <header class="about-hero">
        <img class="about-hero__avatar" src="${url("/assets/images/avatar.svg")}" alt="${escapeAttr(site.author.name)} 的头像" width="140" height="140" loading="eager" decoding="async">
        <div class="about-hero__body">
          <p class="eyebrow">About</p>
          <h1 class="about-hero__title">${escapeHtml(page.title || site.author.name)}</h1>
          <p class="about-hero__bio">${escapeHtml(site.author.bio)}</p>
          <div class="about-hero__links">
            <a class="button button--primary button--small" href="mailto:${escapeAttr(site.author.email)}">${ICONS.mail} 写封邮件</a>
            <a class="button button--ghost button--small" href="https://github.com/${escapeAttr(site.author.github)}" rel="me noopener noreferrer">${ICONS.github} GitHub</a>
          </div>
        </div>
      </header>

      <div class="about-grid">
        <div class="about-body prose">
          ${page.html}
        </div>
        <aside class="about-aside">
          <section class="about-card">
            <h2 class="about-card__title">技术栈</h2>
            <ul class="stack-list">
              ${site.stack.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </section>
          <section class="about-card">
            <h2 class="about-card__title">保持联系</h2>
            <ul class="contact-list">
              <li><span>邮箱</span><a href="mailto:${escapeAttr(site.author.email)}">${escapeHtml(site.author.email)}</a></li>
              <li><span>GitHub</span><a href="https://github.com/${escapeAttr(site.author.github)}" rel="me noopener noreferrer">@${escapeHtml(site.author.github)}</a></li>
              <li><span>RSS</span><a href="${url("/feed.xml")}">订阅更新</a></li>
            </ul>
          </section>
          <section class="about-card about-card--note">
            <h2 class="about-card__title">关于这个博客</h2>
            <p>纯静态、零第三方依赖。文章写在 Markdown 里，由一个小构建脚本生成 HTML，托管在 GitHub Pages 上。</p>
          </section>
        </aside>
      </div>
    </div>`;

  const notFound = ({ page = {} } = {}) => `
    <div class="container">
      <section class="not-found">
        <p class="not-found__code" aria-hidden="true">404</p>
        <h1 class="not-found__title">${escapeHtml(page.title || "这一页没有找到")}</h1>
        <p class="not-found__description">${escapeHtml(page.summary || "链接可能已经失效，或者地址输错了。可以回到首页，或翻翻全部文章。")}</p>
        ${page.html ? `<div class="not-found__body prose">${page.html}</div>` : ""}
        <div class="not-found__actions">
          <a class="button button--primary" href="${url("/")}">回到首页</a>
          <a class="button button--ghost" href="${url("/posts/")}">浏览文章</a>
        </div>
      </section>
    </div>`;

  return {
    layout,
    home,
    postList,
    post,
    tags,
    about,
    notFound,
    url,
    absolute,
  };
}

export { ICONS };
