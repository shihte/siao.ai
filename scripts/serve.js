/* The static server the tests run against.
 *
 * This exists to be *wrong in the same ways Cloudflare Pages is wrong*, and
 * right in the same ways it is right. Two behaviours matter and neither is
 * something a generic file server gives you for free:
 *
 *   - a directory path resolves to index.html inside it, so /zh/ is a real
 *     address rather than a 404, whether or not the visitor typed the
 *     trailing slash
 *   - an unknown path serves 404.html *with a 404 status*, which is what
 *     makes "does this page exist" an answerable question in a test
 *
 * It is not shipped, imported, or part of the site. The site itself still has
 * no build step and no dependencies; this is test scaffolding, and it is
 * dependency-free on purpose so that staying that way costs nothing.
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, extname, normalize } from "node:path";

/* fileURLToPath, not URL.pathname: the latter hands back a percent-encoded
 * string, so a checkout under a directory with a space in it would silently
 * resolve to nothing. */
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.env.PORT ?? 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

/* Refuse to walk out of the site directory. A test server is still a server. */
const resolve = (urlPath) => {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0]));
  if (clean.includes("..")) return null;
  /* No trailing slash and no file extension means a directory was meant —
   * "siao.ai/zh" is a perfectly ordinary thing to type, and Pages resolves
   * it rather than answering 404. */
  const asDirectory = clean.endsWith("/") || !extname(clean);
  return join(ROOT, asDirectory ? `${clean.replace(/\/?$/, "/")}index.html` : clean);
};

createServer(async (req, res) => {
  const path = resolve(req.url);
  const send = (status, body, type) =>
    res.writeHead(status, { "content-type": type }).end(body);

  try {
    if (!path) throw new Error("traversal");
    const body = await readFile(path);
    send(200, body, TYPES[extname(path)] ?? "application/octet-stream");
  } catch {
    try {
      send(404, await readFile(join(ROOT, "404.html")), TYPES[".html"]);
    } catch {
      send(404, "Not found", TYPES[".txt"]);
    }
  }
/* 127.0.0.1, not every interface. A static server that answers the whole
 * local network is not something a test run should quietly start. */
}).listen(PORT, "127.0.0.1");
