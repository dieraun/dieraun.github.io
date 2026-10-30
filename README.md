# SU2.Dieraun

> 技术、设计与日常思考

Dieraun 的个人静态博客。用 Markdown 写作，用原生 Web 呈现；没有数据库、没有后端、没有前端框架，也不依赖任何第三方 npm 包。

站点地址：[https://dieraun.github.io/](https://dieraun.github.io/)

---

## 特性

- **纯静态**：构建后只有 HTML、CSS、JS 和图片，可直接部署到 GitHub Pages、Cloudflare Pages 或任意静态托管。
- **零运行时依赖**：Markdown 解析、代码高亮、页面模板和开发服务器全部使用 Node.js 内置模块实现。
- **三态主题**：跟随系统 / 浅色 / 深色，选择会保存在本地；首屏内联脚本避免主题闪烁。
- **移动端适配**：固定页头、汉堡菜单、单列卡片、可折叠文章目录，覆盖手机、平板和桌面。
- **阅读体验**：约 43rem 的正文宽度、1.9 倍行高、粘性目录、阅读时间估算、上一篇 / 下一篇。
- **代码友好**：代码块带语言标签、语法高亮和一键复制，支持横向滚动，不撑破页面。
- **标签筛选**：标签页在客户端即时筛选，支持 `?tag=技术` 深链接与浏览器前进 / 后退。
- **基础 SEO**：每页独立的 title / description / canonical / Open Graph / Twitter Card，以及 JSON-LD、`sitemap.xml`、RSS 和 `robots.txt`。
- **细节**：回到顶部、404 页面、跳过导航链接、`prefers-reduced-motion` 降级、打印样式。
- **自动部署**：推送到 `main` 分支后，GitHub Actions 自动构建并发布 Pages。

## 技术栈

| 部分 | 方案 |
| --- | --- |
| 构建 | Node.js ≥ 18.17，ES Modules，仅内置模块 |
| 内容 | Markdown + YAML Front Matter |
| 模板 | 原生 JavaScript 模板字符串 |
| 样式 | 原生 CSS，CSS 自定义属性，无预处理器 |
| 交互 | 原生 JavaScript，无框架、无构建器 |
| 部署 | GitHub Actions + GitHub Pages |

> 项目没有 `dependencies`，**不需要运行 `npm install`**。

## 目录结构

```text
.
├─ .github/
│  └─ workflows/
│     └─ deploy.yml          # GitHub Actions 自动部署
├─ scripts/
│  ├─ build.mjs              # 静态站点构建入口
│  ├─ dev.mjs                # 本地开发服务器（带文件监听）
│  └─ lib/
│     ├─ markdown.mjs        # Markdown / Front Matter 解析
│     ├─ highlight.mjs       # 零依赖代码高亮
│     ├─ templates.mjs       # 页面模板与 SEO 标签
│     └─ utils.mjs           # 日期、URL、转义等工具
├─ src/
│  ├─ assets/
│  │  ├─ css/main.css        # 全站样式
│  │  ├─ js/main.js          # 主题、菜单、目录、复制等交互
│  │  ├─ js/tags.js          # 标签页筛选
│  │  └─ images/             # 站点插画、头像
│  ├─ pages/
│  │  ├─ about.md            # 关于页
│  │  └─ 404.md              # 404 页
│  ├─ posts/                 # 所有文章，一篇一个 .md
│  └─ public/                # 原样复制到站点根目录的静态文件
│     ├─ favicon.svg
│     ├─ apple-touch-icon.png
│     └─ og-cover.png
├─ site.config.mjs           # 站点名称、作者、导航、首页文案
├─ package.json
├─ .gitignore
└─ README.md
```

构建产物输出到 `dist/`，已被 `.gitignore` 忽略，不需要提交。

## 本地预览

### 环境要求

- Node.js **18.17 或更高版本**（推荐 20 LTS）
- 不需要安装任何项目依赖

### 启动开发服务器

```bash
npm run dev
```

浏览器打开 <http://localhost:4000/>。修改 `src/` 下的 Markdown、CSS、JS 或 `site.config.mjs` 后会自动重建；浏览器不会自动刷新，手动刷新即可看到最新结果。

### 只构建一次

```bash
npm run build
```

生成 `dist/`。也可以直接调用：

```bash
node scripts/build.mjs
```

### 预览构建结果（不监听文件）

```bash
npm run preview
```

### 修改端口

开发服务器默认使用 `4000` 端口，可通过 `PORT` 环境变量覆盖。

macOS / Linux：

```bash
PORT=4001 npm run dev
```

Windows PowerShell：

```powershell
$env:PORT = "4001"
npm run dev
```

### 本地模拟项目子路径

如果站点最终部署在 `https://dieraun.github.io/my-blog/`，可以在本地用 `BASE_PATH` 模拟：

macOS / Linux：

```bash
BASE_PATH=/my-blog/ npm run dev
```

Windows PowerShell：

```powershell
$env:BASE_PATH = "/my-blog/"
npm run dev
```

访问 <http://localhost:4000/my-blog/>。预览结束后可执行 `Remove-Item Env:BASE_PATH` 清除变量。

## 站点配置

日常只需要修改根目录的 [`site.config.mjs`](site.config.mjs)：

| 字段 | 说明 |
| --- | --- |
| `title` | 站点名称，显示在浏览器标题、页头和页脚 |
| `mark` | 页头左侧的品牌标记字符，默认 `S` |
| `description` | 默认站点描述，用于首页 SEO |
| `tagline` | 一句话简介 |
| `author.name` | 作者名，用于页脚、关于页和文章元信息 |
| `author.email` | 联系邮箱 |
| `author.github` | GitHub 用户名，用于页脚和关于页链接 |
| `author.bio` | 首页底部「关于」区域的短简介 |
| `url` | **站点 origin，不要带仓库子路径**，例如 `https://dieraun.github.io` |
| `basePath` | 本地默认路径；Actions 会用 `BASE_PATH` 覆盖，通常保持 `/` |
| `locale` | 页面语言，默认 `zh-CN` |
| `theme.light` / `theme.dark` | 浏览器地址栏等使用的主题色 |
| `nav` | 导航项；新增项时 `href` 必须是构建后存在的路径 |
| `hero` | 首页大标题、眉题和简介 |
| `stack` | 关于页 / 首页展示的技术栈 |
| `footerNote` | 页脚说明 |
| `ogImage` | 社交分享图路径，默认 `/og-cover.png` |

修改配置后重新运行 `npm run build` 即可生效。

### 替换视觉素材

| 文件 | 用途 |
| --- | --- |
| `src/assets/images/avatar.svg` | 关于页与首页头像 |
| `src/assets/images/reading-scale.svg` | 首页右侧插画 |
| `src/public/favicon.svg` | 浏览器标签页图标 |
| `src/public/apple-touch-icon.png` | iOS 添加到主屏幕图标（180×180） |
| `src/public/og-cover.png` | 社交分享封面（推荐 1200×630） |

颜色、字号、间距、圆角等设计变量集中在 `src/assets/css/main.css` 顶部的 `:root` 与 `[data-theme="dark"]` 中。

## 新增一篇博文

### 1. 创建文件

在 `src/posts/` 下新建 Markdown 文件，命名规则：

```text
YYYY-MM-DD-slug.md
```

例如：

```text
src/posts/2026-11-02-my-first-note.md
```

`slug` 会去掉日期前缀并转为 URL：`my-first-note` → `/posts/my-first-note/`。建议只使用小写英文字母、数字和连字符。

### 2. 写入 Front Matter

```markdown
---
title: "文章标题"
date: 2026-11-02
summary: "一句话摘要，会显示在列表和分享卡片里。"
tags: ["技术", "前端"]
draft: false
---

正文从这里开始。

## 一级小节

支持 **粗体**、*斜体*、`行内代码`、[链接](https://example.com)、列表、引用、表格和围栏代码块。
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 是 | 发布日期，严格使用 `YYYY-MM-DD` |
| `summary` | 否 | 列表摘要；不写会自动截取正文前 120 字 |
| `tags` | 否 | 字符串数组，标签页会自动汇总 |
| `draft` | 否 | `true` 时构建阶段跳过该文章 |
| `updated` | 否 | 更新日期，同样使用 `YYYY-MM-DD` |

### 3. 正文写法

- 标题：`##` 和 `###` 会进入文章目录；`#` 不建议在正文使用。
- 代码块：围栏标记语言后即可高亮，支持 `js` / `ts` / `css` / `html` / `json` / `bash` / `python` / `yaml`。
- 图片：把图片放进 `src/assets/images/`，文章中用相对路径引用：

```markdown
![图片说明](../../assets/images/example.png)
```

文章最终地址是 `/posts/<slug>/`，所以 `../../assets/` 会回到站点资源目录。不要写死 `/assets/...` 或包含仓库名的绝对路径，否则部署到项目子路径时可能失效。

- 表格、引用、有序 / 无序列表、分隔线、删除线均支持。
- 原始 HTML 默认会被转义，避免在 Markdown 中注入脚本。
- 文章目录由 `##` / `###` 自动生成，重复标题会自动加后缀。

### 4. 本地检查

```bash
npm run dev
```

确认标题、日期、摘要、标签、代码块、图片和上下篇都正常，再提交。

## 部署到 GitHub Pages

### 仓库命名规则

GitHub Pages 有两种常用形态：

| 仓库名 | 访问地址 | 路径 |
| --- | --- | --- |
| `dieraun.github.io` | `https://dieraun.github.io/` | 根路径 `/` |
| 任意名称，例如 `blog` | `https://dieraun.github.io/blog/` | 子路径 `/blog/` |

本项目已经适配两种情况：工作流会根据仓库名自动设置 `BASE_PATH`，构建时把所有站内链接、canonical、OG、RSS 和 sitemap 一起改写。

> **重要**：`site.config.mjs` 里的 `url` 只写 `https://dieraun.github.io`，不要写 `https://dieraun.github.io/blog`。仓库子路径由 `BASE_PATH` 负责，重复写会导致 `/blog/blog/`。

### 第一次部署

1. 在 GitHub 新建仓库。想使用根域名就命名为 `dieraun.github.io`；否则用任意仓库名。
2. 在本地初始化并推送：

```bash
git init
git add .
git commit -m "feat: initialize blog"
git branch -M main
git remote add origin https://github.com/dieraun/YOUR_REPO.git
git push -u origin main
```

3. 打开仓库 **Settings → Pages**。
4. 在 **Build and deployment → Source** 中选择 **GitHub Actions**（不要选 “Deploy from a branch”）。
5. 打开 **Actions** 页面，等待 `Deploy blog to GitHub Pages` 工作流完成。
6. 首次部署成功后，Pages 页面会显示访问地址。

之后每次推送到 `main`，工作流都会自动重新构建和部署。也可以在 Actions 页面手动点击 **Run workflow**。

### 自定义域名（可选）

1. 在 `src/public/` 下新建 `CNAME` 文件，内容只写域名，不要带 `https://`：

```text
blog.example.com
```

2. 在域名服务商处添加 CNAME 记录，指向 `dieraun.github.io`。如果是裸域名（`example.com`），需要使用 GitHub Pages 文档中给出的 A 记录。
3. 在仓库 **Settings → Pages → Custom domain** 填入域名并保存，等待 DNS 检查通过。
4. 勾选 **Enforce HTTPS**。
5. 修改 `site.config.mjs` 的 `url` 为 `https://blog.example.com`，重新推送。

工作流检测到 `src/public/CNAME` 后会把 `BASE_PATH` 设为 `/`，因此自定义域名下资源路径不会带仓库名。

## GitHub Actions 说明

工作流文件：[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

触发条件：

- 推送到 `main` 分支
- 在 Actions 页面手动触发 `workflow_dispatch`

流程：

1. **Build**：检出代码，安装 Node.js 20，计算 `BASE_PATH`，执行 `npm run build`。
2. **Configure Pages**：读取仓库的 Pages 配置。
3. **Upload artifact**：把 `dist/` 上传为 Pages 构建产物。
4. **Deploy**：把产物发布到 GitHub Pages 环境。

权限只需要：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

不需要配置任何 Secret。`GITHUB_TOKEN` 由 Actions 自动提供。

工作流使用 `concurrency` 保证同一时间只发布一个版本，新推送会取消排队中的旧任务。

### `BASE_PATH` 的判断顺序

```text
存在 src/public/CNAME        → "/"
仓库名是 <owner>.github.io   → "/"
其他仓库                     → "/<repo>/"
```

如果部署后 CSS / JS 全部 404，优先检查这个值，以及 Pages 的 Source 是否设置为 GitHub Actions。

## 构建原理

`scripts/build.mjs` 做了这些事：

1. 读取 `src/posts/*.md`，解析 Front Matter，跳过 `draft: true`。
2. 按日期倒序排列，生成 slug、摘要、标签、阅读时间和上下篇关系。
3. 用自写的 Markdown 渲染器生成 HTML 与目录标题列表。
4. 用模板拼出首页、文章列表、文章详情、标签、关于和 404 页面。
5. 把 `src/assets/` 与 `src/public/` 复制到 `dist/`。
6. 生成 `sitemap.xml`、`feed.xml`、`robots.txt` 和 `.nojekyll`。

构建是纯离线的：不需要网络，也不会请求 CDN、字体或第三方脚本。

## 常见问题

### 页面能打开，但 CSS 丢失、链接 404

通常是部署路径不对。检查：

- `site.config.mjs` 的 `url` 是否只写了 origin；
- 工作流是否正确设置了 `BASE_PATH`；
- 仓库 **Settings → Pages → Source** 是否选择了 GitHub Actions。

### Source 选择 GitHub Actions 时报 “Server error”

这是 GitHub 创建 Pages 站点时返回的服务端错误，不是构建脚本的问题。按顺序检查：

1. 仓库必须已有 `main` 分支和至少一次提交，且 `.github/workflows/deploy.yml` 已推送。
2. 仓库必须是 **public**；private 仓库需要 GitHub Pro / Team 等支持 Pages 的方案。
3. 当前账号必须是仓库 **Admin**，并已完成邮箱验证。
4. 组织仓库需确认组织没有禁用 Pages；企业账号需确认策略允许。
5. 打开 [GitHub Status](https://www.githubstatus.com/) 看是否有 Pages 故障；也可以换无痕窗口或稍后重试。
6. 如果之前配置过自定义域名，先移除域名再切换 Source，成功后再加回来。

工作流里的 `configure-pages` 已开启 `enablement: true`，会在首次运行时尝试通过 API 自动创建 Pages 站点。推送最新工作流后，到 **Actions → Deploy blog to GitHub Pages → Run workflow** 手动运行一次，通常比在设置页反复点 Save 更稳。

如果仍失败，记录报错时浏览器 Network 面板里 `POST /repos/<owner>/<repo>/pages` 的状态码（常见为 403 / 422 / 500），它能直接指出是权限、仓库状态还是 GitHub 服务问题。

### 构建报错 “日期格式必须为 YYYY-MM-DD”

`date` / `updated` 必须是真实存在的日期，例如 `2026-11-02`，不能写 `2026/11/02` 或 `11-02`。

### 新文章没有出现

- 文件名是否以 `YYYY-MM-DD-` 开头；
- Front Matter 是否有 `draft: true`；
- 是否重新执行了 `npm run build`，或开发服务器是否仍在运行。

### 标签页点击没有反应

标签筛选依赖 `src/assets/js/tags.js`。检查浏览器控制台是否有脚本错误，以及构建产物中是否存在 `dist/assets/js/tags.js`。

### 修改后线上没更新

GitHub Actions 是否成功完成；浏览器 / CDN 是否有缓存，可以强制刷新（Ctrl/Cmd + Shift + R）。Pages 发布通常需要几十秒。

### 为什么不提交 `dist/`

`dist/` 是构建产物，由 Actions 每次生成。提交它容易产生无意义的 diff，也可能让线上内容与源文件不一致。

## 设计与可访问性

- 使用语义化 HTML、跳转到正文链接、可见焦点样式和合理的标题层级。
- 主题切换按钮维护 `aria-label`，菜单按钮维护 `aria-expanded`。
- 尊重 `prefers-reduced-motion`，关闭平滑滚动和装饰动画。
- 代码块可横向滚动，图片最大宽度自适应，表格在小屏幕内滚动。
- 字体使用系统字体栈，不加载外部字体，减少首屏阻塞。

## 联系

- Email：[yanruoxinsu2@outlook.com](mailto:yanruoxinsu2@outlook.com)
- GitHub：[@dieraun](https://github.com/dieraun)

---

内容 © 2026 Dieraun。代码结构可自由参考；转载请注明文章出处。
