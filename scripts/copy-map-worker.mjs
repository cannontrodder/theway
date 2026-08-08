import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const WORKER_FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

const require = createRequire(import.meta.url);
const { version } = require("maplibre-gl/package.json");
const distribution = dirname(require.resolve("maplibre-gl/dist/maplibre-gl.css"));

const publicMaplibre = join(process.cwd(), "public", "maplibre");
const destination = join(publicMaplibre, version);

rmSync(publicMaplibre, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
for (const file of WORKER_FILES) {
  copyFileSync(join(distribution, file), join(destination, file));
}

console.log(
  `Copied MapLibre ${version}'s worker into public/maplibre/${version}/: ${WORKER_FILES.join(", ")}`,
);
