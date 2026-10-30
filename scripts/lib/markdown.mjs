/**
 * 轻量 Markdown 渲染器
 * ------------------------------------------------------------
 * 支持博客常用的 Markdown 子集：
 *   - front matter（YAML 的常用标量 / 列表）
 *   - 标题、段落、强调、行内代码、链接、图片
 *   - 围栏代码块（带语言标签与复制按钮）
 *   - 有序 / 无序列表、引用、分隔线、表格
 *
 * 设计目标是「可控」而不是「完整」：所有 HTML 都由这里生成，
 * 不解析原始 HTML，避免静态构建引入意料之外的标记。
 */
import { escapeAttr, escapeHtml, normalizeTags, slugifyHeading } from "./utils.mjs";
import { highlightCode, languageLabel } from "./highlight.mjs";

const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)\s*$/;
const ATX_HEADING = /^ {0,3}(#{1,6})\s+(.*)$/;
const THEMATIC_BREAK = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;

/* ------------------------------------------------------------------ */
/* Front matter                                                        */
/* ------------------------------------------------------------------ */

/**
 * 解析 `---` 包裹的 front matter。
 * 返回 { data, content }，没有 front matter 时 data 为空对象。
 */
export function parseFrontMatter(source) {
  const text = String(source || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  if (!match) return { data: {}, content: text };

  const data = parseSimpleYaml(match[1]);
  return { data, content: text.slice(match[0].length) };
}

function parseSimpleYaml(block) {
  const result = {};
  const lines = block.split("\n");
  let key = null;
  let buffer = [];

  const commit = () => {
    if (key === null) return;
    result[key] = parseScalar(buffer.join("\n"));
    key = null;
    buffer = [];
  };

  for (const line of lines) {
    if (!line.trim() || /^\s*#/.test(line)) continue;

    const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (pair && !/^\s/.test(line)) {
      commit();
      key = pair[1];
      buffer = [pair[2]];
      continue;
    }

    // 列表项与缩进续行
    if (key !== null && /^\s*(?:-\s+|\S)/.test(line)) {
      buffer.push(line.trim());
    }
  }

  commit();
  return result;
}

function splitInlineArray(raw) {
  const inner = raw.slice(1, -1);
  const parts = [];
  let current = "";
  let quote = null;

  for (const character of inner) {
    if (quote) {
      current += character;
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (character === ",") {
      parts.push(current);
      current = "";
      continue;
    }
    current += character;
  }

  if (current.trim()) parts.push(current);
  return parts.map((part) => parseScalar(part));
}

function parseScalar(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "";

  if (value.startsWith("[") && value.endsWith("]")) {
    return splitInlineArray(value);
  }

  const listLines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (listLines.length && listLines.every((line) => /^-\s+/.test(line))) {
    return listLines.map((line) => parseScalar(line.replace(/^-\s+/, "")));
  }

  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === "true";
  if (/^(null|~)$/i.test(value)) return null;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    const inner = value.slice(1, -1);
    if (value.startsWith('"')) {
      try {
        return JSON.parse(value);
      } catch {
        // 不是合法 JSON 字符串时，退化为普通去引号文本
      }
    }
    return inner.replace(/''/g, "'");
  }

  return listLines.length > 1 ? listLines.join(" ") : value;
}

/* ------------------------------------------------------------------ */
/* 行内解析                                                            */
/* ------------------------------------------------------------------ */

const INLINE_PATTERNS = [
  {
    type: "image",
    re: /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+["']([^"']*)["'])?\s*\)/y,
  },
  {
    type: "link",
    re: /\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+["']([^"']*)["'])?\s*\)/y,
  },
  { type: "autolink", re: /<((?:https?:\/\/|mailto:)[^>\s]+)>/y },
  { type: "strong", re: /\*\*(?=\S)([\s\S]*?\S)\*\*/y },
  { type: "strong", re: /__(?=\S)([\s\S]*?\S)__/y },
  { type: "del", re: /~~(?=\S)([\s\S]*?\S)~~/y },
  { type: "em", re: /\*(?=\S)([\s\S]*?\S)\*/y },
  {
    type: "em",
    re: /(?<![\p{L}\p{N}_])_(?=\S)([\s\S]*?\S)_(?![\p{L}\p{N}_])/uy,
  },
  { type: "code", re: /``([^`\n]+)``/y },
  { type: "code", re: /`([^`\n]+)`/y },
];

function isCjk(character = "") {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(character);
}

function safeUrl(url) {
  const value = String(url || "").trim();
  if (/^\s*javascript:/i.test(value) || /^\s*data:/i.test(value)) return "#";
  return value;
}

/**
 * 行内渲染。逐字符扫描 + sticky 正则，避免「先替换 A 再破坏 B」
 * 这类常见的高亮 / 链接互相污染问题。
 */
export function renderInline(source) {
  const text = String(source ?? "");
  let output = "";
  let index = 0;

  const renderChildren = (value) => renderInline(value);

  while (index < text.length) {
    const character = text[index];

    // 反斜杠转义
    if (character === "\\" && index + 1 < text.length) {
      const next = text[index + 1];
      if (/[\\`*_{}[\]()#+\-.!~>|]/.test(next)) {
        output += escapeHtml(next);
        index += 2;
        continue;
      }
    }

    // 软换行 / 硬换行
    if (character === "\n") {
      if (/ {2,}$/.test(text.slice(0, index))) {
        output = output.replace(/ {2,}$/, "") + "<br>\n";
      } else if (isCjk(text[index - 1]) && isCjk(text[index + 1])) {
        // 中文换行不插入空格，保持自然排版
      } else {
        output += " ";
      }
      index += 1;
      continue;
    }

    // 行内 Markdown 标记
    let matched = false;
    for (const pattern of INLINE_PATTERNS) {
      pattern.re.lastIndex = index;
      const match = pattern.re.exec(text);
      if (!match) continue;

      matched = true;
      index += match[0].length;

      switch (pattern.type) {
        case "image": {
          const [, alt, src, title] = match;
          const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
          output += `<img src="${escapeAttr(safeUrl(src))}" alt="${escapeAttr(alt)}"${titleAttr} loading="lazy" decoding="async">`;
          break;
        }
        case "link": {
          const [, label, href, title] = match;
          const url = safeUrl(href);
          const external = /^https?:\/\//i.test(url);
          const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
          const rel = external ? ' rel="noopener noreferrer"' : "";
          output += `<a href="${escapeAttr(url)}"${titleAttr}${rel}>${renderChildren(label)}</a>`;
          break;
        }
        case "autolink": {
          const url = match[1];
          const label = url.replace(/^mailto:/, "");
          output += `<a href="${escapeAttr(url)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
          break;
        }
        case "strong":
          output += `<strong>${renderChildren(match[1])}</strong>`;
          break;
        case "em":
          output += `<em>${renderChildren(match[1])}</em>`;
          break;
        case "del":
          output += `<del>${renderChildren(match[1])}</del>`;
          break;
        case "code":
          output += `<code>${escapeHtml(match[1].trim())}</code>`;
          break;
        default:
          output += escapeHtml(match[0]);
      }
      break;
    }

    if (matched) continue;

    output += escapeHtml(character);
    index += 1;
  }

  return output;
}

/* ------------------------------------------------------------------ */
/* 块级解析                                                            */
/* ------------------------------------------------------------------ */

function leadingSpaces(line) {
  const match = /^[ \t]*/.exec(line);
  return match ? match[0].replace(/\t/g, "  ").length : 0;
}

function matchListItem(line) {
  const match = LIST_ITEM.exec(line);
  if (!match) return null;
  return {
    indent: match[1].replace(/\t/g, "  ").length,
    ordered: /^\d/.test(match[2]),
    start: /^\d/.test(match[2]) ? Number.parseInt(match[2], 10) : 1,
    text: match[3],
  };
}

function isTableStart(lines, index) {
  const header = lines[index];
  const divider = lines[index + 1];
  if (!header || !divider) return false;
  if (!header.includes("|")) return false;
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(divider);
}

function splitTableRow(line) {
  let value = line.trim();
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|")) value = value.slice(0, -1);

  const cells = [];
  let current = "";
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }

  cells.push(current.trim());
  return cells;
}

function alignmentFromDivider(divider) {
  const cells = splitTableRow(divider);
  return cells.map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return null;
  });
}

function isBlockStart(lines, index) {
  const line = lines[index];
  if (line === undefined) return false;
  return (
    FENCE.test(line) ||
    ATX_HEADING.test(line) ||
    THEMATIC_BREAK.test(line) ||
    /^ {0,3}>/.test(line) ||
    /^ {0,3}([-*+]|\d+[.)])\s+/.test(line) ||
    isTableStart(lines, index)
  );
}

function parseList(lines, start, context) {
  const first = matchListItem(lines[start]);
  const ordered = first.ordered;
  const baseIndent = first.indent;
  const items = [];
  let index = start;
  let loose = false;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      let next = index + 1;
      while (next < lines.length && !lines[next].trim()) next += 1;
      if (next >= lines.length) break;

      const nextItem = matchListItem(lines[next]);
      const nextIndent = leadingSpaces(lines[next]);
      const continues =
        (nextItem && nextItem.indent === baseIndent && nextItem.ordered === ordered) ||
        nextIndent > baseIndent;

      if (!continues) break;
      items[items.length - 1].lines.push("");
      loose = true;
      index = next;
      continue;
    }

    const item = matchListItem(line);
    if (item && item.indent === baseIndent && item.ordered === ordered) {
      items.push({ lines: [item.text] });
      index += 1;
      continue;
    }

    const indent = leadingSpaces(line);
    if (indent > baseIndent) {
      // 去掉列表项缩进，交给递归渲染器处理嵌套列表 / 引用 / 代码
      const strip = Math.min(indent, baseIndent + 2);
      items[items.length - 1].lines.push(line.slice(strip));
      index += 1;
      continue;
    }

    break;
  }

  const tag = ordered ? "ol" : "ul";
  const startAttr = ordered && first.start !== 1 ? ` start="${first.start}"` : "";
  const rendered = items
    .map((item) => {
      const html = renderBlocks(item.lines, context).trim();
      const singleParagraph = /^<p>[\s\S]*<\/p>$/.test(html) && !html.includes("</p><");
      const content = singleParagraph && !loose ? html.slice(3, -4) : html;
      return `<li>${content}</li>`;
    })
    .join("");

  return {
    html: `<${tag}${startAttr}>${rendered}</${tag}>`,
    next: index,
  };
}

function parseTable(lines, start) {
  const headerCells = splitTableRow(lines[start]);
  const alignments = alignmentFromDivider(lines[start + 1]);
  let index = start + 2;
  const bodyRows = [];

  while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
    bodyRows.push(splitTableRow(lines[index]));
    index += 1;
  }

  const cell = (tag, content, column) => {
    const alignment = alignments[column];
    const className = alignment ? ` class="align-${alignment}"` : "";
    return `<${tag}${className}>${renderInline(content)}</${tag}>`;
  };

  const head = headerCells.map((value, column) => cell("th", value, column)).join("");
  const body = bodyRows
    .map(
      (row) =>
        `<tr>${row
          .map((value, column) => cell("td", value, column))
          .join("")}</tr>`,
    )
    .join("");

  return {
    html: `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`,
    next: index,
  };
}

function renderCodeBlock(code, language) {
  const lang = String(language || "").trim();
  return [
    `<figure class="code-block" data-language="${escapeAttr(lang)}">`,
    `<figcaption class="code-block__head">`,
    `<span class="code-block__lang">${escapeHtml(languageLabel(lang))}</span>`,
    `<button class="code-block__copy" type="button" data-copy-code>复制</button>`,
    `</figcaption>`,
    `<pre class="code-block__pre" tabindex="0"><code class="language-${escapeAttr(lang || "text")}">${highlightCode(code, lang)}</code></pre>`,
    `</figure>`,
  ].join("");
}

function renderBlocks(lines, context) {
  let html = "";
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    // 围栏代码块
    const fence = FENCE.exec(line);
    if (fence) {
      const marker = fence[1];
      const language = fence[2] || "";
      const codeLines = [];
      let cursor = index + 1;

      while (cursor < lines.length) {
        const closing = new RegExp(`^ {0,3}${marker[0] === "`" ? "`" : "~"}{${marker.length},}\\s*$`);
        if (closing.test(lines[cursor])) break;
        codeLines.push(lines[cursor]);
        cursor += 1;
      }

      html += renderCodeBlock(codeLines.join("\n"), language);
      index = cursor < lines.length ? cursor + 1 : cursor;
      continue;
    }

    // ATX 标题
    const heading = ATX_HEADING.exec(line);
    if (heading) {
      const level = heading[1].length;
      const rawText = heading[2].replace(/\s+#+\s*$/, "").trim();
      const plainText = rawText.replace(/[*_`~]/g, "");
      const id = context.uniqueId(plainText);
      if (level === 2 || level === 3) {
        context.headings.push({ level, id, text: plainText });
      }
      html += `<h${level} id="${escapeAttr(id)}">${renderInline(rawText)}<a class="heading-anchor" href="#${escapeAttr(id)}" aria-label="链接到本节">#</a></h${level}>`;
      index += 1;
      continue;
    }

    // 分隔线
    if (THEMATIC_BREAK.test(line)) {
      html += "<hr>";
      index += 1;
      continue;
    }

    // 引用
    if (/^ {0,3}>/.test(line)) {
      const quoted = [];
      while (index < lines.length && /^ {0,3}>/.test(lines[index])) {
        quoted.push(lines[index].replace(/^ {0,3}>\s?/, ""));
        index += 1;
      }
      html += `<blockquote>${renderBlocks(quoted, context)}</blockquote>`;
      continue;
    }

    // 表格
    if (isTableStart(lines, index)) {
      const table = parseTable(lines, index);
      html += table.html;
      index = table.next;
      continue;
    }

    // 列表
    if (matchListItem(line)) {
      const list = parseList(lines, index, context);
      html += list.html;
      index = list.next;
      continue;
    }

    // 段落：收集到空行或下一个块级结构
    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html += `<p>${renderInline(paragraph.join("\n"))}</p>`;
  }

  return html;
}

/* ------------------------------------------------------------------ */
/* 公共 API                                                            */
/* ------------------------------------------------------------------ */

/**
 * 渲染 Markdown 正文。
 * @returns {{ html: string, headings: Array<{level:number,id:string,text:string}> }}
 */
export function renderMarkdown(source) {
  const text = String(source || "").replace(/\r\n?/g, "\n");
  const headings = [];
  const slugCounts = new Map();

  const context = {
    headings,
    uniqueId(value) {
      const base = slugifyHeading(value);
      const count = slugCounts.get(base) || 0;
      slugCounts.set(base, count + 1);
      return count === 0 ? base : `${base}-${count + 1}`;
    },
  };

  const html = renderBlocks(text.split("\n"), context);
  return { html, headings };
}

/** 把标题列表渲染成文章内的目录 */
export function renderToc(headings) {
  const items = (headings || []).filter((heading) => heading.level === 2 || heading.level === 3);
  if (!items.length) return "";

  const links = items
    .map(
      (heading) =>
        `<li class="toc__item toc__item--h${heading.level}"><a href="#${escapeAttr(heading.id)}">${escapeHtml(heading.text)}</a></li>`,
    )
    .join("");

  return [
    `<nav class="toc" aria-labelledby="toc-title">`,
    `<p class="toc__title" id="toc-title">目录</p>`,
    `<ol class="toc__list">${links}</ol>`,
    `</nav>`,
  ].join("");
}

export { normalizeTags };
