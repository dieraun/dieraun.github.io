/**
 * 极简代码高亮器
 * ------------------------------------------------------------
 * 不引入 Prism / highlight.js，只用一个逐字符扫描器处理
 * 博客里常见的几种语言。规则按顺序匹配，匹配到就整体上色，
 * 不会出现正则嵌套替换常见的标签破坏问题。
 */
import { escapeHtml } from "./utils.mjs";

const LABELS = {
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TSX",
  css: "CSS",
  scss: "SCSS",
  html: "HTML",
  xml: "XML",
  json: "JSON",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  zsh: "Zsh",
  python: "Python",
  py: "Python",
  yaml: "YAML",
  yml: "YAML",
  markdown: "Markdown",
  md: "Markdown",
  text: "文本",
  "": "代码",
};

const ALIASES = {
  javascript: "js",
  jsx: "js",
  ts: "js",
  typescript: "js",
  tsx: "js",
  scss: "css",
  shell: "bash",
  sh: "bash",
  zsh: "bash",
  py: "python",
  yml: "yaml",
};

export function languageLabel(language) {
  const key = String(language || "").toLowerCase();
  return LABELS[key] || key || "代码";
}

const JS_RULES = [
  { type: "comment", re: /\/\/[^\n]*/y },
  { type: "comment", re: /\/\*[\s\S]*?\*\//y },
  { type: "string", re: /`(?:\\[\s\S]|[^\\`])*`/y },
  { type: "string", re: /"(?:\\.|[^"\\])*"/y },
  { type: "string", re: /'(?:\\.|[^'\\])*'/y },
  { type: "number", re: /\b(?:0[xX][\da-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/y },
  {
    type: "keyword",
    re: /\b(?:const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|from|export|default|async|await|try|catch|finally|throw|typeof|instanceof|this|super|switch|case|break|continue|do|delete|void|yield|static|get|set|true|false|null|undefined)\b/y,
  },
  {
    type: "property",
    re: /\b(?:console|document|window|globalThis|Math|JSON|Object|Array|Promise|Map|Set|WeakMap|Date|String|Number|Boolean|RegExp|Error|URL|URLSearchParams|Intl)\b/y,
  },
  { type: "function", re: /\b[A-Za-z_$][\w$]*(?=\s*\()/y },
  { type: "operator", re: /=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\?\.|[+\-*/%=<>!&|^~?:]/y },
  { type: "punct", re: /[{}[\]();,.]/y },
];

const CSS_RULES = [
  { type: "comment", re: /\/\*[\s\S]*?\*\//y },
  { type: "string", re: /"(?:\\.|[^"\\])*"/y },
  { type: "string", re: /'(?:\\.|[^'\\])*'/y },
  { type: "keyword", re: /@[\w-]+/y },
  { type: "property", re: /--[\w-]+/y },
  { type: "number", re: /#[0-9a-fA-F]{3,8}\b/y },
  {
    type: "number",
    re: /\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch|ex|pt)?\b/y,
  },
  { type: "property", re: /[a-z-]+(?=\s*:)/y },
  { type: "function", re: /[a-zA-Z-]+(?=\s*\()/y },
  { type: "keyword", re: /!important\b/y },
  { type: "operator", re: /[>+~*=/]/y },
  { type: "punct", re: /[{}();:,]/y },
];

const HTML_RULES = [
  { type: "comment", re: /<!--[\s\S]*?-->/y },
  { type: "keyword", re: /<!DOCTYPE[^>]*>/iy },
  { type: "tag", re: /<\/?[A-Za-z][^>]*>/y },
  { type: "number", re: /&[a-zA-Z#0-9]+;/y },
];

const JSON_RULES = [
  { type: "property", re: /"(?:\\.|[^"\\])*"(?=\s*:)/y },
  { type: "string", re: /"(?:\\.|[^"\\])*"/y },
  { type: "number", re: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/iy },
  { type: "keyword", re: /\b(?:true|false|null)\b/y },
  { type: "punct", re: /[{}[\],:]/y },
];

const BASH_RULES = [
  { type: "comment", re: /#[^\n]*/y },
  { type: "string", re: /"(?:\\.|[^"\\])*"/y },
  { type: "string", re: /'[^']*'/y },
  { type: "variable", re: /\$\{?[\w@#?*!-]+\}?/y },
  {
    type: "keyword",
    re: /\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|function|in|local|export|readonly|return|set|unset|shift|source|alias|echo|printf|cd|pwd|mkdir|rm|cp|mv|cat|touch|grep|sed|awk|curl|git|npm|node)\b/y,
  },
  { type: "number", re: /\b\d+\b/y },
  { type: "operator", re: /&&|\|\||[|&><=;]/y },
];

const PYTHON_RULES = [
  { type: "comment", re: /#[^\n]*/y },
  { type: "string", re: /"""[\s\S]*?"""/y },
  { type: "string", re: /'''[\s\S]*?'''/y },
  { type: "string", re: /"(?:\\.|[^"\\])*"/y },
  { type: "string", re: /'(?:\\.|[^'\\])*'/y },
  { type: "decorator", re: /@[\w.]+/y },
  {
    type: "keyword",
    re: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/y,
  },
  {
    type: "property",
    re: /\b(?:print|len|range|str|int|float|list|dict|set|tuple|bool|enumerate|zip|open|sum|min|max|sorted)\b/y,
  },
  { type: "number", re: /\b\d+(?:\.\d+)?\b/y },
  { type: "operator", re: /==|!=|<=|>=|[-+*/%=<>:]/y },
  { type: "punct", re: /[()[\]{},.]/y },
];

const YAML_RULES = [
  { type: "comment", re: /#[^\n]*/y },
  { type: "property", re: /^[ \t]*[\w.-]+(?=\s*:)/my },
  { type: "string", re: /"(?:\\.|[^"\\])*"/y },
  { type: "string", re: /'[^']*'/y },
  { type: "keyword", re: /\b(?:true|false|null|yes|no)\b/iy },
  { type: "number", re: /\b\d+(?:\.\d+)?\b/y },
  { type: "punct", re: /^[ \t]*[-:]/my },
];

const RULES = {
  js: JS_RULES,
  css: CSS_RULES,
  html: HTML_RULES,
  json: JSON_RULES,
  bash: BASH_RULES,
  python: PYTHON_RULES,
  yaml: YAML_RULES,
};

/**
 * 将代码转成带 token class 的 HTML。
 * 遇到未知语言时只做 HTML 转义，保证安全。
 */
export function highlightCode(code, language = "") {
  const raw = String(code ?? "");
  const key = String(language || "").toLowerCase();
  const normalized = ALIASES[key] || key;
  const rules = RULES[normalized];

  if (!raw) return "";
  if (!rules) return escapeHtml(raw);

  let result = "";
  let plain = "";
  let index = 0;

  const flushPlain = () => {
    if (plain) {
      result += escapeHtml(plain);
      plain = "";
    }
  };

  while (index < raw.length) {
    let matched = false;

    for (const rule of rules) {
      rule.re.lastIndex = index;
      const match = rule.re.exec(raw);

      if (match && match.index === index && match[0].length > 0) {
        flushPlain();
        result += `<span class="tok-${rule.type}">${escapeHtml(match[0])}</span>`;
        index += match[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      plain += raw[index];
      index += 1;
    }
  }

  flushPlain();
  return result;
}
