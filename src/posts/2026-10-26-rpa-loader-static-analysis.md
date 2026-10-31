---
title: "RPA loader.pyo 静态解析：不执行字节码的归档解包"
date: 2026-10-26
summary: "拆解 Ren'Py RPA 的头部、索引与密钥来源，用 AST 读取 loader.pyo，避免为了解包而执行目标字节码。"
tags: ["逆向", "格式解析", "Python", "安全"]
---

## 问题

社区里的 RPA 解包工具大多能完成基本工作，但实现路径分成两类：一类依赖游戏运行时，另一类直接反序列化或执行 `loader.pyo` 里的逻辑。前者部署成本高，后者把不可信字节码带进了当前进程。

`rpa-extract-analyzer` 的目标很窄：只读文件，提取密钥与索引，完成解包；不执行目标程序的任何字节码。

## 容器结构

RPA-3.0 的头部是文本行：

```text
RPA-3.0 <index_offset_hex> <key_hex>
```

索引位于 `index_offset`，取出后与 `key` 做异或，再解压为条目列表。每个条目包含资源名、偏移、长度与前缀。关键点在于：索引偏移和密钥都必须来自文件本身，不能假定固定值。

| 字段 | 位置 | 校验 |
| --- | --- | --- |
| 魔数 | 文件头 | 必须匹配 `RPA-3.0` |
| 索引偏移 | 头部 | 小于文件长度，且不与头部重叠 |
| 密钥 | 头部 | 32 位十六进制 |
| 索引长度 | 文件尾/头部推导 | 设置解压上限，防止压缩炸弹 |
| 条目偏移 | 索引 | 落在数据区，长度不越界 |

## 从 loader.pyo 取密钥

有些归档的密钥不在头部，而在 `loader.pyo` 的常量或函数参数里。正确做法不是 `exec`，而是把 `.pyo` 当二进制容器解析，拿到 code object 后遍历常量与指令。

```python
import ast
import marshal

def read_code_constants(pyo_path: str) -> list[object]:
    with open(pyo_path, "rb") as fh:
        fh.read(16)              # Python 3.11+ 头部
        code = marshal.load(fh)  # 只反序列化 code object
    return list(code.co_consts)
```

拿到常量后，用 AST 或字节码模式匹配定位密钥，而不是运行函数。解析器只处理已知结构，遇到未知指令直接报错并保留偏移。

> 边界：`marshal` 不是安全格式。只对通过哈希校验、来源可信的样本使用，并在独立进程中设置资源限制。

## 只读解析流程

1. 读取文件头，校验魔数与字段范围。
2. 按偏移读取索引块，限制解压后大小。
3. 异或解密，反序列化为条目表。
4. 逐条校验偏移、长度与路径。
5. 流式复制到输出目录，写完后校验长度。

```python
def safe_target(root: Path, name: str) -> Path:
    target = (root / name).resolve()
    if root.resolve() not in target.parents:
        raise ValueError(f"path escape: {name}")
    return target
```

路径校验不能只做字符串替换。`..`、绝对路径、Windows 盘符、符号链接都要在 `resolve()` 之后判断，并且写入时使用 `O_NOFOLLOW`（平台支持时）。

## 结果与限制

当前实现覆盖 RPA-3.0 的常见布局，支持密钥提取、索引重建和流式解包。对加密资源、异常压缩流与损坏索引只做拒绝，不做猜测性恢复。

这类工具的价值不在于“支持更多格式”，而在于把失败原因说清楚：是魔数不对、索引越界，还是条目长度与文件实际大小不一致。可诊断的错误比模糊的“解包失败”更有用。
