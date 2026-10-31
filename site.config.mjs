/**
 * 站点基础配置
 * ------------------------------------------------------------
 * 修改后运行 `npm run build` 生效。
 * GitHub Pages 的子路径由 Actions 的 BASE_PATH 自动注入。
 */
const siteConfig = {
  // ---- 站点身份 -------------------------------------------------
  title: "SU2.Dieraun",
  mark: "S",
  description:
    "Dieraun 的技术作品集：二进制逆向、私有归档格式解析、跨平台高性能工具与底层工程笔记。",
  tagline: "二进制逆向 · 归档格式解析 · 跨平台工具",

  author: {
    name: "Dieraun",
    email: "yanruoxinsu2@outlook.com",
    github: "dieraun",
    bio: "专注二进制逆向、私有归档格式解析与跨平台高性能工具开发。",
  },

  // ---- 地址 -----------------------------------------------------
  url: "https://dieraun.github.io",
  basePath: "/",
  locale: "zh-CN",

  // ---- 主题色 ---------------------------------------------------
  theme: {
    light: "#f2f5f8",
    dark: "#0e1319",
  },

  // ---- 导航 -----------------------------------------------------
  nav: [
    { key: "home", label: "首页", href: "/" },
    { key: "projects", label: "项目", href: "/#projects" },
    { key: "tags", label: "标签", href: "/tags/" },
    { key: "about", label: "关于", href: "/about/" },
  ],

  // ---- 首屏 -----------------------------------------------------
  // 轮播文案：前端每 5 秒切换一次，首屏直接输出第一组，禁用 JS 时仍可阅读。
  hero: {
    eyebrow: "PERSONAL NOTES · OPEN SOURCE",
    slides: [
      {
        title: "试图重写旧工具的开源爱好者 🛠️",
        description:
          "代码能跑就行（不是），其实在追求可复现构建的路上越走越远 (๑•̀ㅂ•́)و✧",
      },
      {
        title: "一个喜欢折腾底层技术的普通人 🌟",
        description:
          "欢迎来到我的数字自留地，这里存放着关于逆向、解析和系统的碎碎念~",
      },
      {
        title: "沉迷二进制逆向，偶尔修修破车 💻",
        description:
          "每天都在和跨平台工具、静态分析死磕，今天也是没有 Bug 的一天呢 (´･ω･`)",
      },
      {
        title: "靠咖啡续命的跨平台开发者 ☕️",
        description:
          "只管埋头写代码，剩下的交给老天爷吧 🚀 欢迎常来看看！",
      },
    ],
  },

  // ---- 项目 -----------------------------------------------------
  // 每项：repo 对应 GitHub 仓库名；clone/run 显示在“快速上手”。
  projects: [
    {
      repo: "rpa-extract-analyzer",
      title: "rpa-extract-analyzer",
      subtitle: "Ren'Py RPA 归档逆向解析",
      stack: "Python 3.11 · AST · CLI · pytest",
      highlights: [
        "对标 rpx / unrpa / rpatool：无需加载游戏运行时，直接解析 loader.pyo 结构。",
        "静态 AST 分析提取密钥与索引，只读解析归档，不执行字节码。",
        "流式解包，内存占用与归档体积解耦；输出路径做穿越校验。",
      ],
      clone: "git clone https://github.com/dieraun/rpa-extract-analyzer.git",
      run: "python rpa_extract.py unpack archive.rpa -o out",
      tags: ["逆向", "解析", "Python", "CLI", "安全"],
    },
    {
      repo: "mp4_merger",
      title: "mp4_merger",
      subtitle: "基于 FFmpeg 的批量媒体合并 CLI",
      stack: "Python · FFmpeg · subprocess · CLI",
      highlights: [
        "封装 FFmpeg concat demuxer，避免逐帧转码带来的画质与时间损耗。",
        "批量任务串行调度，失败项保留原始 stderr，便于定位编码问题。",
        "只依赖系统 FFmpeg，单文件脚本可审计，无 GUI 与额外运行时依赖。",
      ],
      clone: "git clone https://github.com/dieraun/mp4_merger.git",
      run: "python mp4_merger.py --files a.mp4 b.mp4 -o merged.mp4",
      tags: ["FFmpeg", "CLI", "批处理", "视频处理"],
    },
    {
      repo: "campbuddy-rpa-unpacker-",
      title: "campbuddy-rpa-unpacker",
      subtitle: "定向 RPA 资源归档解包",
      stack: "Python · 二进制解析 · CLI",
      highlights: [
        "针对特定 RPA 资源布局重建索引，处理通用解包器无法识别的私有头。",
        "解析前校验魔数、偏移与长度，拒绝越界读取与路径穿越。",
        "单命令输出原始目录树，保留资源命名与相对路径。",
      ],
      clone: "git clone https://github.com/dieraun/campbuddy-rpa-unpacker-.git",
      run: "python unpacker.py --dir ./resources -o ./output",
      tags: ["逆向", "RPA", "解包", "Python"],
    },
    {
      repo: "Device-Viewer",
      title: "device-viewer",
      subtitle: "局域网低延迟画面串流",
      stack: "Rust · WebSocket · egui · 并发",
      highlights: [
        "采集端与查看端分离，帧数据只走局域网 WebSocket，不经过公网中转。",
        "有界通道与背压控制，弱网下丢帧而不是无限堆积内存。",
        "CLI 启动 + egui 查看器，跨平台构建；仅监听显式绑定的内网地址。",
      ],
      clone: "git clone https://github.com/dieraun/Device-Viewer.git",
      run: "cargo run --release -- --bind 0.0.0.0:8080",
      tags: ["串流", "Rust", "局域网", "egui"],
    },
  ],

  // 预留项目位：后续实现 Wallpaper Engine 解包工具时替换为正式 projects 项。
  plannedProject: {
    code: "05 / PLANNED",
    title: "wallpaper-engine-pkg",
    subtitle: "Wallpaper Engine pkg / mpkg 解包",
    stack: "Rust · 归档解析 · CLI + GUI",
    description:
      "目标：解析 pkg / mpkg 容器与资源索引，提供只读挂载、资源导出与完整性校验。",
    tags: ["逆向", "格式解析", "Rust", "规划"],
  },

  // ---- GitHub 全部仓库 ------------------------------------------
  // 先作为静态快照随 HTML 输出；main.js 会尝试从 GitHub API 刷新，
  // 接口不可用或触发限流时继续显示这份快照。
  repositories: [
    {
      name: "Formflux",
      description: "本地优先的离线多媒体、图像、文档与哈希工具箱。",
      language: "Rust",
      url: "https://github.com/dieraun/Formflux",
    },
    {
      name: "RePKG-Enhanced",
      description: "跨平台 Wallpaper Engine PKG 解包器，支持流式大文件与批量处理。",
      language: "C#",
      url: "https://github.com/dieraun/RePKG-Enhanced",
    },
    {
      name: "Device-Viewer",
      description: "跨平台硬件信息查看器，Rust + egui，提供 GUI 与 CLI。",
      language: "Rust",
      url: "https://github.com/dieraun/Device-Viewer",
    },
    {
      name: "dieraun.github.io",
      description: "本站源码、模板与零依赖构建脚本。",
      language: "JavaScript",
      url: "https://github.com/dieraun/dieraun.github.io",
    },
    {
      name: "rpa-extract-analyzer",
      description: "Ren'Py RPA 只读解析与静态密钥提取工具。",
      language: "Python",
      url: "https://github.com/dieraun/rpa-extract-analyzer",
    },
    {
      name: "mp4_merger",
      description: "基于 FFmpeg 的 Windows 批量视频合并工具。",
      language: "Python",
      url: "https://github.com/dieraun/mp4_merger",
    },
    {
      name: "campbuddy-rpa-unpacker-",
      description: "CampBuddy RPA-3.0 资源归档解包工具。",
      language: "Python",
      url: "https://github.com/dieraun/campbuddy-rpa-unpacker-",
    },
    {
      name: "myweblearn114",
      description: "HTML 学习与实验页面。",
      language: "HTML",
      url: "https://github.com/dieraun/myweblearn114",
    },
  ],

  // ---- 关于页 ---------------------------------------------------
  stack: ["Rust", "Python", "并发编程", "egui", "自动化 CI 发布"],

  // ---- 页脚 -----------------------------------------------------
  footerNote: "静态生成，构建产物可直接审计。",
  ogImage: "/og-cover.png",
};

export default siteConfig;
