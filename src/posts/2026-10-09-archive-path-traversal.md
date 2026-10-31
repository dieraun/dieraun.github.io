---
title: "归档解包的路径穿越防护：从字符串拼接到规范化"
date: 2026-10-09
summary: "解包器把归档内的不可信路径写到磁盘，必须同时处理 ..、绝对路径、符号链接与平台差异。"
tags: ["安全", "解析", "Python", "文件系统"]
---

## 输入不可信

归档里的文件名由生成方控制。`../../etc/passwd`、`C:\Windows\System32\...`、以 `/` 开头的绝对路径，都是常见 payload。只在字符串里删除 `..` 不够：编码、分隔符、符号链接与 Unicode 规范化都会让检查失效。

一个可靠的解包路径需要同时满足：

- 结果落在指定输出目录内。
- 不跟随归档中创建的符号链接。
- 在 Windows 与 POSIX 上行为一致。
- 失败时拒绝整个条目，不静默改名。

## 规范化顺序

先拒绝明显非法输入，再做路径解析，最后用真实路径判断父子关系。

```python
from pathlib import Path

def resolve_member(root: Path, name: str) -> Path:
    if "\x00" in name or name.startswith(("/", "\\")):
        raise ValueError("absolute path or NUL byte")

    candidate = (root / name).resolve()
    root_real = root.resolve()

    if candidate != root_real and root_real not in candidate.parents:
        raise ValueError(f"path escape: {name}")
    return candidate
```

`resolve()` 会展开符号链接与 `..`，因此必须在目标已存在时判断；对尚不存在的文件，先解析父目录，再拼回文件名。

## 符号链接

归档可能先写入一个指向外部的符号链接，再写入该链接下的文件。即使路径字符串合法，最终写入也会逃逸。

处理策略：

1. 默认拒绝归档中的符号链接与硬链接。
2. 如确需支持，创建后立即用 `lstat()` 确认不是链接，再决定是否保留。
3. 写入使用 `os.open(..., os.O_NOFOLLOW)`，在支持的平台拒绝跟随。
4. 解包完成后遍历输出目录，检查是否有指向根目录之外的链接。

## 平台差异

| 输入 | POSIX 风险 | Windows 风险 |
| --- | --- | --- |
| `..\..\x` | 反斜杠是普通字符 | 被当作分隔符 |
| `C:\x` | 盘符是普通字符 | 绝对路径 |
| `a:b` | 合法文件名 | 可能触发 NTFS ADS |
| `CON`, `NUL` | 普通文件名 | 保留设备名 |
| 尾随空格/点 | 保留 | 被系统截断 |

跨平台工具不能只按运行平台校验。归档可能在 Linux 上生成、在 Windows 上解包，因此需要按目标文件系统规则做一次归一化，并把保留名、ADS、尾随空格纳入拒绝列表。

## 流式写入

不要在内存里拼接整个文件再落盘。边读边写，限制单条目与总解压体积，避免压缩炸弹。

```python
def extract(entry, root: Path) -> None:
    target = resolve_member(root, entry.name)
    target.parent.mkdir(parents=True, exist_ok=True)

    remaining = entry.size
    with entry.open() as src, open(target, "xb") as dst:
        while chunk := src.read(min(64 * 1024, remaining)):
            dst.write(chunk)
            remaining -= len(chunk)
        if remaining != 0:
            raise ValueError("truncated entry")
```

`open(..., "xb")` 拒绝覆盖已有文件，也避免并发条目互相踩踏。错误信息要带条目名与偏移，方便定位是归档损坏还是恶意构造。

## 结论

路径穿越不是一次字符串替换，而是“输入校验 → 规范化 → 真实路径约束 → 安全打开”的组合。任何一步缺失，前面的检查都可能被绕过。
