import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const PLUGIN_ID = "ptune-task";
const outDir = join("dist", PLUGIN_ID);

rmSync("dist", { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const file of ["main.js", "manifest.json", "styles.css"]) {
  if (existsSync(file)) {
    cpSync(file, join(outDir, file));
  }
}

if (existsSync("assets")) {
  cpSync("assets", join(outDir, "assets"), { recursive: true });
}

process.stdout.write(`Prepared dist folder: ${outDir}\n`);
