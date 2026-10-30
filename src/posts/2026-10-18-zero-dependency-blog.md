---
title: 从零搭一个没有依赖的静态博客
date: 2026-10-18
summary: 不用框架、不装依赖，只靠 Node 内置模块把 Markdown 变成可部署的静态站点。记录这套小构建的取舍与实现。
tags: ["技术", "前端", "Node.js", "构建"]
---

这个博客没有用 Next.js，也没有用 Astro、Hugo 或 Jekyll。它只有一个 Node 脚本、一套手写的 Markdown 渲染器，以及一些原生 CSS 和 JavaScript。

不是因为框架不好，而是我想把这件事做到自己完全理解为止。

## 为什么不用框架

静态博客的需求其实很窄：读 Markdown、套模板、生成 HTML、复制资源。大多数框架都能做，而且做得更多。但“更多”也意味着更长的构建链、更厚的依赖树，以及某天升级时突然出现的一堆 breaking changes。

我想要的东西很具体：

- 一台装了 Node 的电脑就能构建；
- 不执行 `npm install`；
- 生成的产物是纯 HTML、CSS、JS；
- 任何一个文件出问题，我都能顺着代码读下去。

所以最后只用了 `node:fs`、`node:path`、`node:url` 这些内置模块。

## 目录结构

站点分成“源文件”和“构建产物”两部分。`src/` 里放内容与资源，`dist/` 完全由脚本生成，并且不提交到 Git。

| 路径 | 作用 |
| --- | --- |
| `src/posts/` | 文章 Markdown，文件名带日期 |
| `src/pages/` | 关于页、404 等独立页面 |
| `src/assets/` | CSS、JavaScript、图片 |
| `src/public/` | favicon、分享图等根目录文件 |
| `scripts/` | 构建与本地预览脚本 |
| `dist/` | 构建产物，部署时上传 |

文章文件名遵循 `YYYY-MM-DD-slug.md`。日期用于排序，slug 用于生成 URL。构建时会检查日期是否真实存在、slug 是否重复，避免把错误带到线上。

## 构建流程

整个构建可以概括成四步：读取、解析、渲染、写出。

```js
const files = await readdir(postsDir);
const posts = [];

for (const file of files) {
  if (!file.endsWith(".md")) continue;

  const source = await readFile(path.join(postsDir, file), "utf8");
  const { data, content } = parseFrontMatter(source);
  const rendered = renderMarkdown(content);

  posts.push({
    ...data,
    html: rendered.html,
    headings: rendered.headings,
  });
}
```

`parseFrontMatter` 只处理我实际会用到的语法：字符串、布尔值、行内数组，以及用短横线开头的列表。没有必要为了“完整支持 YAML”再引入一个解析器。

Markdown 渲染器也是同样的思路。标题、段落、列表、引用、表格、代码块、图片、链接，够用了。原始 HTML 默认被转义，链接会过滤 `javascript:` 和 `data:` 协议。它不是 CommonMark 的完整实现，但边界清楚，出错时容易定位。

## 代码高亮怎么做

没有引入 Prism 或 Shiki，而是写了一个逐字符扫描的小高亮器。它认识 JavaScript、CSS、HTML、JSON、Bash、Python 和 YAML，输出一组 `tok-*` 类名，颜色交给 CSS 变量控制。

```css
.code-block {
  border: 1px solid var(--code-border);
  border-radius: var(--radius-md);
  background: var(--code-bg);
}

.tok-keyword { color: var(--code-keyword); }
.tok-string  { color: var(--code-string); }
.tok-comment { color: var(--code-comment); font-style: italic; }
```

它不可能像专业高亮库那样覆盖所有边缘语法，但对博客里的代码片段来说，已经足够，而且构建过程仍然是零依赖的。

## 那些“看起来很小”的决定

真正花时间的不是把页面生成出来，而是一些很小的决定：

- 文章页的目录要不要在移动端默认展开？最后选择收起，点开再看。
- 代码块右上角要不要显示语言？要，但只作为安静的提示，不抢正文。
- 主题切换要不要做三态？要。跟随系统是默认，手动选择则应该被记住。
- 没有 JavaScript 时页面还能不能读？能。导航、正文、链接都保留，只是少了筛选和复制。

这些细节不会出现在功能列表里，但它们决定了站点用起来是否顺手。

## 什么时候不该这样做

如果你需要评论、全文搜索、图片处理、国际化，或者团队里不止一个人写内容，那么自己维护一套构建系统很快会变成负担。这时候用成熟的框架更划算。

零依赖不是目的，清楚自己在为什么做取舍才是。

对这个博客来说，答案很简单：我想要一个能长期维护、随时能读懂、部署成本几乎为零的地方，安安静静地写字。现在它做到了。
