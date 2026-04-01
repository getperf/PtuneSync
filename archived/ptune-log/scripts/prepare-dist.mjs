import { mkdirSync, cpSync, rmSync, existsSync } from "fs";
import { join } from "path";

const outDir = "dist/ptune-log";

rmSync("dist", { recursive: true, force: true });

mkdirSync(outDir, { recursive: true });

for (const file of ["main.js", "manifest.json", "styles.css"]) {
  cpSync(file, join(outDir, file));
}

/* assets copy */

if (existsSync("assets")) {
  cpSync("assets", join(outDir, "assets"), { recursive: true });
}

console.log("Prepared dist folder:", outDir);