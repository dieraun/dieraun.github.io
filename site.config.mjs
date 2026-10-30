/**
 * 站点基础配置
 * ------------------------------------------------------------
 * 这是整个博客唯一需要经常修改的配置文件。
 * 修改后重新运行 `npm run build` 即可生效。
 *
 * 部署到 GitHub Pages 时，Actions 会通过 BASE_PATH 环境变量
 * 自动传入仓库的子路径，一般不需要手动修改 basePath。
 */
const siteConfig = {
  // ---- 站点身份 -------------------------------------------------
  title: "SU2.Dieraun",
  mark: "S",
  description: "Dieraun 的个人博客，记录前端开发、设计思考与日常生活。",
  tagline: "技术、设计与日常思考",

  author: {
    name: "Dieraun",
    email: "yanruoxinsu2@outlook.com",
    github: "dieraun",
    bio: "一个喜欢前端、设计与写作的人。相信把复杂的事讲清楚，本身就是一种创造。",
  },

  // ---- 地址 -----------------------------------------------------
  // 用户主页仓库使用根路径；若绑定自定义域名，也保持 "/"。
  url: "https://dieraun.github.io",
  basePath: "/",
  locale: "zh-CN",

  // ---- 主题色 ---------------------------------------------------
  theme: {
    light: "#f7f6f2",
    dark: "#101310",
  },

  // ---- 导航 -----------------------------------------------------
  nav: [
    { key: "home", label: "首页", href: "/" },
    { key: "posts", label: "文章", href: "/posts/" },
    { key: "tags", label: "标签", href: "/tags/" },
    { key: "about", label: "关于", href: "/about/" },
  ],

  // ---- 首页文案 -------------------------------------------------
  hero: {
    eyebrow: "技术笔记 · 生活随笔",
    titleLines: ["把复杂的事，", "写简单一点。"],
    description:
      "这里记录前端、设计，以及日常生活里那些值得多想一会儿的事。不追热点，只写真正想清楚的。",
  },

  // ---- 关于页 ---------------------------------------------------
  stack: ["HTML / CSS", "JavaScript / TypeScript", "Node.js", "设计系统", "可访问性"],

  // ---- 页脚 -----------------------------------------------------
  footerNote: "用 Markdown 写作，用原生 Web 呈现。",
  ogImage: "/og-cover.png",
};

export default siteConfig;
