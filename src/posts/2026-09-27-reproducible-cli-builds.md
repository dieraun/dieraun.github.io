---
title: "跨平台 CLI 的可复现构建与发布流水线"
date: 2026-09-27
summary: "锁定工具链与依赖，固定构建参数，按目标平台产出可校验的二进制，并用 CI 重复验证同一份源码。"
tags: ["Rust", "构建", "CI", "跨平台"]
---

## 可复现的定义

同一份源码、同一组输入、同一套工具链，在任意机器上产出字节一致的构建物，或至少产出可验证的功能一致物。对 CLI 工具，后者通常更现实：链接器、时间戳与路径会引入差异，但版本、依赖图和发布内容必须可追踪。

最低要求：

- 提交 lockfile，CI 使用 `--locked`。
- 固定 Rust toolchain 版本，不使用浮动的 `stable`。
- 构建参数写入仓库，而不是只存在于发布者终端历史里。
- 每个产物附带 SHA-256 校验和。
- 发布前在干净环境重跑一次构建。

## 工具链固定

`rust-toolchain.toml` 让本地与 CI 使用同一版本：

```toml
[toolchain]
channel = "1.82.0"
components = ["rustfmt", "clippy"]
targets = ["x86_64-unknown-linux-musl", "x86_64-pc-windows-msvc"]
```

只写 `stable` 会产生“今天能过、下周失败”的构建。升级工具链应当是一次显式提交，并附带完整测试结果。

## 构建参数

```bash
cargo build --locked --release --target x86_64-unknown-linux-musl
strip target/x86_64-unknown-linux-musl/release/tool
sha256sum target/x86_64-unknown-linux-musl/release/tool > tool.sha256
```

注意点：

- `--locked` 失败时不要自动更新 lockfile，先确认依赖变更。
- 静态链接 musl 可以减少运行环境差异，但 DNS、时区与证书行为需要单独测试。
- `strip` 会改变二进制哈希，但发布物与校验和必须由同一次构建产生。
- Windows 产物在对应 runner 上构建，不交叉编译 MSVC。

## 发布矩阵

| 目标 | Runner | 产物 |
| --- | --- | --- |
| Linux x86_64 | ubuntu-latest | `tool-linux-x86_64.tar.gz` |
| macOS arm64 | macos-14 | `tool-macos-arm64.tar.gz` |
| Windows x86_64 | windows-latest | `tool-windows-x86_64.zip` |

压缩包内只放可执行文件、许可证与简短 README。不要把整个 `target/` 目录上传。用固定时间戳与排序后的文件列表打包，减少无意义的字节差异。

```bash
tar --sort=name --mtime='UTC 2020-01-01' \
  --owner=0 --group=0 --numeric-owner \
  -czf tool-linux-x86_64.tar.gz tool LICENSE
```

## 验证发布物

发布流水线最后一步应当下载刚上传的产物，校验哈希，并运行 `--version` 与一条最小命令。只验证“构建成功”不够：真正要验证的是用户拿到的文件能启动、架构正确、动态库依赖完整。

```bash
./tool --version
ldd ./tool || true
sha256sum -c tool.sha256
```

## 小结

可复现不是某个编译器开关，而是一组约束：锁定依赖、固定工具链、明确目标、校验产物、在干净环境重复执行。把这些写进仓库，发布才不依赖某个人的机器状态。
