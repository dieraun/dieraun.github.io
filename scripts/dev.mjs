/**
 * 本地开发服务器
 * ------------------------------------------------------------
 * 运行：npm run dev
 *   - 启动前先构建一次
 *   - 监听 src/ 与 site.config.mjs，改动后自动重建
 *   - 把 dist/ 作为静态目录提供服务，无需额外依赖
 *
 * 只预览、不监听：npm run preview
 */
import { createReadStream, watch } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import siteConfig from "../site.config.mjs";
import { build } from "./build.mjs";
import { normalizeBasePath } from "./lib/utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const srcDir = path.join(rootDir, "src");
const configFile = path.join(rootDir, "site.config.mjs");

const basePath = normalizeBasePath(process.env.BASE_PATH || siteConfig.basePath);
const port = Number(process.env.PORT) || 4000;
const shouldWatch = !process.argv.includes("--no-watch");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function resolveRequestPath(requestPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(requestPath);
  } catch {
    return null;
  }

  if (pathname.includes("\0")) return null;
  if (basePath && pathname === "/") return { redirect: `${basePath}/` };
  if (basePath && !pathname.startsWith(`${basePath}/`) && pathname !== basePath) {
    return null;
  }

  let relative = basePath ? pathname.slice(basePath.length) : pathname;
  if (!relative) relative = "/";
  if (relative.endsWith("/")) relative += "index.html";

  const filePath = path.resolve(distDir, `.${relative}`);
  if (!filePath.startsWith(`${distDir}${path.sep}`) && filePath !== distDir) {
    return null;
  }

  return { filePath, pathname };
}

async function serveFile(res, filePath, status = 200) {
  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) return false;

    res.writeHead(status, {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "Content-Length": stats.size,
    });

    if (res.req.method === "HEAD") {
      res.end();
      return true;
    }

    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
    return;
  }

  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const resolved = resolveRequestPath(requestUrl.pathname);

  if (!resolved) {
    send(res, 404, "Not Found");
    return;
  }

  if (resolved.redirect) {
    res.writeHead(302, { Location: resolved.redirect });
    res.end();
    return;
  }

  if (await serveFile(res, resolved.filePath)) return;

  // 无扩展名的目录请求：尝试补 index.html，或重定向到带斜杠的地址
  const withoutIndex = resolved.filePath.replace(/index\.html$/, "");
  try {
    if (statSync(withoutIndex).isDirectory() && !requestUrl.pathname.endsWith("/")) {
      res.writeHead(301, { Location: `${requestUrl.pathname}/` });
      res.end();
      return;
    }
  } catch {
    // 继续走 404
  }

  const notFoundPage = path.join(distDir, "404.html");
  if (await serveFile(res, notFoundPage, 404)) return;

  send(res, 404, "Not Found");
});

/* ------------------------------------------------------------------ */
/* 监听与重建                                                          */
/* ------------------------------------------------------------------ */

let building = false;
let queued = false;
let rebuildTimer = null;
let watchers = [];

async function rebuild() {
  if (building) {
    queued = true;
    return;
  }

  building = true;
  try {
    await build();
  } catch (error) {
    console.error(`\n✗ 重建失败：${error.message}\n`);
  } finally {
    building = false;
    if (queued) {
      queued = false;
      await rebuild();
    }
  }
}

function closeWatchers() {
  for (const watcher of watchers) watcher.close();
  watchers = [];
}

/**
 * Node 在部分平台不支持 recursive watch，
 * 这里手动为每个目录挂一个 watcher，兼顾 Windows / macOS / Linux。
 */
function installWatchers() {
  closeWatchers();

  const walk = (directory) => {
    try {
      const watcher = watch(directory, () => scheduleRebuild());
      watchers.push(watcher);

      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(path.join(directory, entry.name));
      }
    } catch (error) {
      console.warn(`无法监听目录 ${directory}：${error.message}`);
    }
  };

  walk(srcDir);
  try {
    watchers.push(watch(configFile, () => scheduleRebuild()));
  } catch {
    // 配置文件单独监听失败不影响主流程
  }
}

function scheduleRebuild() {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(async () => {
    installWatchers();
    await rebuild();
  }, 120);
}

await rebuild();

server.listen(port, () => {
  console.log(`\n  SU2.Dieraun 开发服务器`);
  console.log(`  本地地址  http://localhost:${port}${basePath || ""}/`);
  console.log(`  输出目录  dist/`);
  if (shouldWatch) {
    console.log(`  监听中    src/ 与 site.config.mjs（Ctrl+C 退出）\n`);
    installWatchers();
  } else {
    console.log(`  预览模式  不监听文件变化（Ctrl+C 退出）\n`);
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`端口 ${port} 已被占用，请换一个端口：PORT=4001 npm run dev`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});

process.on("SIGINT", () => {
  closeWatchers();
  server.close(() => process.exit(0));
});
