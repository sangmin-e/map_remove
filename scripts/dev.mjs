import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const geocodeHandler = require("../api/geocode.js");
const routeHandler = require("../api/route.js");
const port = Number(process.env.SAI_DEV_PORT || 4174);
const dist = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const query = Object.fromEntries(url.searchParams.entries());
  const requestWithQuery = Object.assign(request, { query });

  response.status = (code) => {
    response.statusCode = code;
    return response;
  };
  response.json = (value) => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(value));
    return response;
  };

  if (url.pathname === "/api/geocode") return geocodeHandler(requestWithQuery, response);
  if (url.pathname === "/api/route") return routeHandler(requestWithQuery, response);

  try {
    const requestedPath = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
    const filePath = resolve(dist, requestedPath);
    const pathFromDist = relative(dist, filePath);
    if (pathFromDist.startsWith("..") || isAbsolute(pathFromDist)) throw new Error("Invalid path");
    const file = await readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Local app: http://127.0.0.1:${port}`);
});
