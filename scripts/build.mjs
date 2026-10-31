/**
 * 静态站点构建脚本
 * ------------------------------------------------------------
 * 只用 Node 内置模块：
 *   src/posts/*.md  -> dist/posts/<slug>/index.html
 *   src/pages/*.md  -> 关于页、404
 *   src/assets      -> dist/assets
 *   src/public      -> dist/
 *
 * 运行：npm run build
 * GitHub Actions 会通过 BASE_PATH 注入仓库子路径。
 */
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import siteConfig from "../site.config.mjs";
import { parseFrontMatter, renderMarkdown } from "./lib/markdown.mjs";
import { createTemplates } from "./lib/templates.mjs";
import {
  absoluteUrl,
  assertValidDate,
  escapeXml,
  excerptFromMarkdown,
  formatDate,
  normalizeBasePath,
  normalizeTags,
  readingTime,
} from "./lib/utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist");
const postsDir = path.join(sourceDir, "posts");
const pagesDir = path.join(sourceDir, "pages");
const assetsDir = path.join(sourceDir, "assets");
const publicDir = path.join(sourceDir, "public");

const basePath = normalizeBasePath(process.env.BASE_PATH || siteConfig.basePath);
const site = { ...siteConfig, basePath };
const templates = createTemplates(site, basePath);
const absolute = (pathname) => absoluteUrl(site.url, basePath, pathname);

async function writePage(relativePath, html) {
  const target = path.join(distDir, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${html.trim()}\n`, "utf8");
}

function assertSafeSlug(slug, sourceFile) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      `${sourceFile}: slug 只能包含小写字母、数字和连字符，当前为 “${slug}”`,
    );
  }
}

/**
 * 读取并渲染全部文章。
 * 文件名约定：YYYY-MM-DD-slug.md，front matter 可覆盖 slug。
 */
async function readPosts() {
  const entries = await readdir(postsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();

  const posts = [];
  const usedSlugs = new Set();

  for (const file of files) {
    const raw = await readFile(path.join(postsDir, file), "utf8");
    const { data, content } = parseFrontMatter(raw);

    if (data.draft === true) continue;

    const title = String(data.title || "").trim();
    if (!title) throw new Error(`${file}: 缺少 front matter 字段 title`);

    const date = String(data.date || "").trim();
    assertValidDate(date, `${file}: date`);

    const updated = data.updated ? String(data.updated).trim() : date;
    if (data.updated) assertValidDate(updated, `${file}: updated`);

    let slug = String(data.slug || file.replace(/\.md$/i, "")).trim();
    slug = slug
      .toLowerCase()
      .replace(/^\d{4}-\d{2}-\d{2}-/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    assertSafeSlug(slug, file);
    if (usedSlugs.has(slug)) throw new Error(`${file}: slug 重复 “${slug}”`);
    usedSlugs.add(slug);

    const summary = String(
      data.summary || excerptFromMarkdown(content, 120),
    ).trim();
    const tags = normalizeTags(data.tags);
    const { html, headings } = renderMarkdown(content);

    posts.push({
      sourceFile: file,
      slug,
      url: `/posts/${slug}/`,
      title,
      date,
      updated,
      summary,
      tags,
      html,
      headings,
      readingMinutes: readingTime(content),
      rawContent: content,
    });
  }

  posts.sort(
    (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "zh-CN"),
  );

  // 上一篇 = 更早发布，下一篇 = 更晚发布（符合按时间阅读的直觉）
  posts.forEach((post, index) => {
    post.prev = index < posts.length - 1 ? posts[index + 1] : null;
    post.next = index > 0 ? posts[index - 1] : null;
  });

  return posts;
}

function buildJsonLd(posts) {
  const homeUrl = absolute("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${homeUrl}#website`,
        name: site.title,
        url: homeUrl,
        description: site.description,
        inLanguage: site.locale,
        author: {
          "@type": "Person",
          name: site.author.name,
          url: `https://github.com/${site.author.github}`,
        },
      },
      {
        "@type": "Blog",
        "@id": `${homeUrl}#blog`,
        name: site.title,
        description: site.description,
        inLanguage: site.locale,
        blogPost: posts.slice(0, 10).map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: absolute(post.url),
          datePublished: `${post.date}T00:00:00+08:00`,
        })),
      },
    ],
  };
}

function postJsonLd(post) {
  const canonical = absolute(post.url);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: `${post.date}T00:00:00+08:00`,
    dateModified: `${post.updated}T00:00:00+08:00`,
    inLanguage: site.locale,
    author: {
      "@type": "Person",
      name: site.author.name,
      url: `https://github.com/${site.author.github}`,
    },
    image: absolute(site.ogImage),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    keywords: post.tags.join(", "),
  };
}

async function buildSitemap(posts) {
  const latestDate = posts[0]?.date || formatDate(new Date().toISOString().slice(0, 10), "iso");
  const urls = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/posts/", priority: "0.9", changefreq: "weekly" },
    { path: "/tags/", priority: "0.6", changefreq: "monthly" },
    { path: "/about/", priority: "0.6", changefreq: "monthly" },
    ...posts.map((post) => ({
      path: post.url,
      priority: "0.8",
      changefreq: "monthly",
      lastmod: post.updated,
    })),
  ];

  const entries = urls
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(absolute(entry.path))}</loc>
    <lastmod>${entry.lastmod || latestDate}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n");

  await writeFile(
    path.join(distDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
    "utf8",
  );
}

async function buildFeed(posts) {
  const homeUrl = absolute("/");
  const feedUrl = absolute("/feed.xml");
  const lastBuildDate = posts[0]
    ? formatDate(posts[0].updated, "rfc822")
    : formatDate(new Date().toISOString().slice(0, 10), "rfc822");

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(absolute(post.url))}</link>
      <guid isPermaLink="true">${escapeXml(absolute(post.url))}</guid>
      <pubDate>${formatDate(post.date, "rfc822")}</pubDate>
      <description>${escapeXml(post.summary)}</description>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");

  await writeFile(
    path.join(distDir, "feed.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${escapeXml(homeUrl)}</link>
    <description>${escapeXml(site.description)}</description>
    <language>${escapeXml(site.locale)}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`,
    "utf8",
  );
}

async function build() {
  const startedAt = Date.now();

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  const posts = await readPosts();
  if (!posts.length) throw new Error("src/posts/ 下没有可发布的文章");

  const tagCounts = new Map();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  // 首页
  await writePage(
    "index.html",
    templates.layout({
      title: "",
      description: site.description,
      canonicalPath: "/",
      activeNav: "home",
      bodyClass: "page-home",
      content: templates.home({ posts, tags: [...tagCounts.keys()] }),
      jsonLd: buildJsonLd(posts),
    }),
  );

  // 文章列表
  await writePage(
    "posts/index.html",
    templates.layout({
      title: "全部文章",
      description: `${site.title} 的全部文章，共 ${posts.length} 篇，按发布时间排列。`,
      canonicalPath: "/posts/",
      activeNav: "posts",
      bodyClass: "page-posts",
      content: templates.postList({ posts }),
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "全部文章",
        url: absolute("/posts/"),
        inLanguage: site.locale,
        isPartOf: { "@type": "WebSite", name: site.title, url: absolute("/") },
      },
    }),
  );

  // 文章详情
  for (const post of posts) {
    await writePage(
      path.join("posts", post.slug, "index.html"),
      templates.layout({
        title: post.title,
        description: post.summary,
        canonicalPath: post.url,
        activeNav: "posts",
        bodyClass: "page-post",
        content: templates.post({ post, prev: post.prev, next: post.next }),
        ogType: "article",
        publishedTime: `${post.date}T00:00:00+08:00`,
        modifiedTime: `${post.updated}T00:00:00+08:00`,
        jsonLd: postJsonLd(post),
      }),
    );
  }

  // 标签页
  await writePage(
    "tags/index.html",
    templates.layout({
      title: "标签",
      description: `按标签浏览 ${site.title} 的文章：逆向、格式解析、性能与底层工程。`,
      canonicalPath: "/tags/",
      activeNav: "tags",
      bodyClass: "page-tags",
      content: templates.tags({ posts, tagCounts }),
      scripts: ["/assets/js/tags.js"],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "标签",
        url: absolute("/tags/"),
        inLanguage: site.locale,
      },
    }),
  );

  // 关于页
  const aboutRaw = await readFile(path.join(pagesDir, "about.md"), "utf8");
  const aboutPage = parseFrontMatter(aboutRaw);
  const aboutBody = renderMarkdown(aboutPage.content);
  const aboutTitle = String(aboutPage.data.title || "关于我");

  await writePage(
    "about/index.html",
    templates.layout({
      title: aboutTitle,
      description:
        String(aboutPage.data.summary || "").trim() ||
        `关于 ${site.author.name}：个人简介、兴趣方向、技术栈与联系方式。`,
      canonicalPath: "/about/",
      activeNav: "about",
      bodyClass: "page-about",
      content: templates.about({
        page: { ...aboutPage.data, html: aboutBody.html, headings: aboutBody.headings },
      }),
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: aboutTitle,
        url: absolute("/about/"),
        inLanguage: site.locale,
        mainEntity: {
          "@type": "Person",
          name: site.author.name,
          email: site.author.email,
          url: `https://github.com/${site.author.github}`,
          description: site.author.bio,
        },
      },
    }),
  );

  // 404
  const notFoundRaw = await readFile(path.join(pagesDir, "404.md"), "utf8");
  const notFoundPage = parseFrontMatter(notFoundRaw);
  const notFoundBody = renderMarkdown(notFoundPage.content);

  await writePage(
    "404.html",
    templates.layout({
      title: "页面未找到",
      description: "这一页没有找到。可以回到首页，或者浏览全部文章。",
      canonicalPath: "/404.html",
      noindex: true,
      bodyClass: "page-404",
      content: templates.notFound({ page: { ...notFoundPage.data, html: notFoundBody.html } }),
    }),
  );

  // 静态资源
  await cp(assetsDir, path.join(distDir, "assets"), { recursive: true });
  await cp(publicDir, distDir, { recursive: true });

  // GitHub Pages：跳过 Jekyll 处理
  await writeFile(path.join(distDir, ".nojekyll"), "", "utf8");

  // robots.txt
  await writeFile(
    path.join(distDir, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${absolute("/sitemap.xml")}\n`,
    "utf8",
  );

  await buildSitemap(posts);
  await buildFeed(posts);

  const elapsed = Date.now() - startedAt;
  const pageCount = 5 + posts.length; // 首页、列表、标签、关于、404 + 每篇文章
  console.log(`\n✓ 构建完成  ${posts.length} 篇文章 · ${pageCount} 个页面 · ${elapsed}ms`);
  console.log(`  输出目录：${path.relative(rootDir, distDir)}/`);
  console.log(`  本地预览：http://localhost:4000${basePath || ""}/\n`);
}

export { build };

// 直接执行 node scripts/build.mjs 时运行构建
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  build().catch((error) => {
    console.error(`\n✗ 构建失败：${error.message}\n`);
    process.exitCode = 1;
  });
}
