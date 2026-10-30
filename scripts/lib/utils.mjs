/**
 * 构建期通用工具
 * ------------------------------------------------------------
 * 这里只放无副作用的纯函数，方便在模板、Markdown 渲染器
 * 和构建入口之间复用。
 */

/** HTML 文本转义（也可安全用于双引号属性） */
export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[character];
  });
}

export const escapeAttr = escapeHtml;

/** XML / RSS / sitemap 文本转义 */
export const escapeXml = escapeHtml;

/**
 * 把 basePath 统一成「没有末尾斜杠」的形式。
 * "/" -> ""
 * "/blog/" -> "/blog"
 */
export function normalizeBasePath(input = "/") {
  let value = String(input || "/").trim();

  // 如果误传了完整 URL，只取 pathname 部分
  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname;
    } catch {
      value = "/";
    }
  }

  if (!value) return "";
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/+/g, "/").replace(/\/+$/, "");

  return value === "" ? "" : value;
}

/** 给站内绝对路径加上部署子路径 */
export function withBase(basePath, pathname = "/") {
  const pathValue = String(pathname || "/");

  // 外部地址、锚点和 mailto 等保持原样
  if (/^(https?:|mailto:|tel:|#|data:)/i.test(pathValue)) {
    return pathValue;
  }

  const normalized = pathValue.startsWith("/") ? pathValue : `/${pathValue}`;
  return `${basePath}${normalized}` || "/";
}

/** 生成绝对 URL，用于 canonical、Open Graph、sitemap 和 RSS */
export function absoluteUrl(siteUrl, basePath, pathname = "/") {
  const origin = String(siteUrl || "").replace(/\/+$/, "");
  return `${origin}${withBase(basePath, pathname)}`;
}

/** 校验 YYYY-MM-DD，并返回日期各部分 */
export function parseDateParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) {
    throw new Error(`日期格式必须为 YYYY-MM-DD，收到：${value}`);
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    throw new Error(`日期不存在：${value}`);
  }

  return { year, month, day, date };
}

export function assertValidDate(value, label = "date") {
  try {
    parseDateParts(value);
  } catch (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

/** 日期显示格式 */
export function formatDate(value, style = "short") {
  const { year, month, day, date } = parseDateParts(value);

  switch (style) {
    case "long":
      return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
    case "monthDay":
      return `${month}.${day}`;
    case "iso":
      return `${year}-${month}-${day}`;
    case "rfc822":
      return date.toUTCString();
    case "short":
    default:
      return `${year}.${month}.${day}`;
  }
}

/** 粗略估算中文阅读时长：中文 400 字/分钟，英文 220 词/分钟 */
export function readingTime(markdown) {
  const text = String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[#>*+\-\d.\s|:]+/gm, " ");

  const cjkCount = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  const wordCount = (
    text
      .replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ")
      .match(/[A-Za-z0-9][A-Za-z0-9'’_-]*/g) || []
  ).length;

  const minutes = cjkCount / 400 + wordCount / 220;
  return Math.max(1, Math.ceil(minutes));
}

/** 去掉常见行内 Markdown 标记，保留可读文本 */
export function stripInlineMarkdown(value = "") {
  return String(value)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~]{1,3}/g, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!~>])/g, "$1")
    .trim();
}

/** 从正文中提取摘要，作为没有写 summary 时的兜底 */
export function excerptFromMarkdown(markdown, limit = 120) {
  const text = String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~]{1,3}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}…`;
}

/** 生成适合作为 HTML id 的中文/英文标题锚点 */
export function slugifyHeading(value = "") {
  const slug = stripInlineMarkdown(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) return "section";
  return /^\d/.test(slug) ? `section-${slug}` : slug;
}

/** 把标签统一成去重后的字符串数组 */
export function normalizeTags(tags) {
  if (tags == null) return [];
  const list = Array.isArray(tags)
    ? tags
    : String(tags)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
}

/** JSON 写入 <script> 前防止 </script> 截断 */
export function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** 给路径统一使用正斜杠，便于跨平台比较 */
export function toPosix(value) {
  return String(value).replace(/\\/g, "/");
}

/** 限制数值范围 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
