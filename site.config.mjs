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
  hero: {
    eyebrow: "REVERSE ENGINEERING · ARCHIVE PARSING · SYSTEMS",
    titleLines: ["专注二进制逆向、归档格式解析与跨平台高性能工具开发。"],
    description:
      "以静态分析、只读解析和可复现构建为基础，重写仍在维护的旧工具。",
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

  // ---- 关于页 ---------------------------------------------------
  stack: ["Rust", "Python", "并发编程", "egui", "自动化 CI 发布"],

  // ---- 页脚 -----------------------------------------------------
  footerNote: "静态生成，构建产物可直接审计。",
  ogImage: "/og-cover.png",
};

export default siteConfig;
