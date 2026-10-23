import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const publicFiles = ["index.html", "styles.css", "app.js", "favicon.svg"];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await Promise.all(publicFiles.map((file) => cp(resolve(root, file), resolve(dist, file))));
console.log(`Built ${publicFiles.length} static files into dist/`);
