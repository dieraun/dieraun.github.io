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
    light: "#f7faff",
    dark: "#0b1220",
  },

  // ---- 导航 -----------------------------------------------------
  nav: [
    { key: "home", label: "首页", href: "/" },
    { key: "projects", label: "项目", href: "/#projects" },
    { key: "tags", label: "标签", href: "/tags/" },
    { key: "about", label: "关于", href: "/about/" },
  ],

  // ---- 首页文案 -------------------------------------------------
  hero: {
    eyebrow: "开源项目 · 技术随笔",
    titleLines: ["把复杂的事，", "写简单一点。"],
    description:
      "我做工具，也写字。这里放着四个正在维护的开源项目，以及关于前端、设计与日常的思考。",
  },

  // ---- 首页开源项目 ---------------------------------------------
  // 修改这里即可更新首页卡片；repo 对应 GitHub 仓库名。
  projects: [
    {
      repo: "rpa-extract-analyzer",
      icon: "chart",
      kicker: "RPA · 数据分析",
      title: "RPA 数据提取，不该靠复制粘贴。",
      description:
        "把网页、表格与日志里的 RPA 运行数据批量抽取，清洗后输出可直接分析的 CSV / JSON。",
      usage: "克隆后安装依赖，指定数据目录即可运行分析。",
      command: "python analyze.py --input ./data",
      tags: ["RPA", "数据提取", "Python", "效率工具"],
    },
    {
      repo: "mp4_merger",
      icon: "video",
      kicker: "视频处理 · 命令行",
      title: "一键合并 MP4，把时间留给内容。",
      description:
        "不用打开剪辑软件，直接输入文件路径就能按顺序快速合并，适合处理零散的录屏与素材。",
      usage: "把待合并的文件路径交给脚本，回车完成。",
      command: "python mp4_merger.py --files a.mp4 b.mp4",
      tags: ["视频处理", "MP4", "FFmpeg", "工具"],
    },
    {
      repo: "campbuddy-rpa-unpacker-",
      icon: "box",
      kicker: "RPA · 资源解包",
      title: "资源解包，也可以是一键的事。",
      description:
        "针对特定 RPA 场景的资源目录，一键还原图片、配置与文本素材，并附带完整的环境说明。",
      usage: "配置好环境，指定资源目录，一条命令开始解包。",
      command: "python unpacker.py --dir ./resources",
      tags: ["RPA", "解包工具", "逆向", "实战"],
    },
    {
      repo: "Device-Viewer",
      icon: "monitor",
      kicker: "设备互联 · 局域网",
      title: "跨设备查看，不必离开座位。",
      description:
        "在局域网内把移动端画面实时投到电脑，多设备切换查看，延迟低，也不需要数据线。",
      usage: "电脑与手机连接同一 Wi-Fi，启动服务后输入地址。",
      command: "python server.py --port 8080",
      tags: ["设备互联", "远程查看", "局域网", "监控"],
    },
  ],

  // ---- 关于页 ---------------------------------------------------
  stack: ["HTML / CSS", "JavaScript / TypeScript", "Node.js", "设计系统", "可访问性"],

  // ---- 页脚 -----------------------------------------------------
  footerNote: "用 Markdown 写作，用原生 Web 呈现。",
  ogImage: "/og-cover.png",
};

export default siteConfig;
