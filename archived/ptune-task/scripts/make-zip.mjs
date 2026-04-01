import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const pluginDir = join("dist", "ptune-task");
const zipPath = resolve("dist", `${pkg.name}-${pkg.version}.zip`);

if (!existsSync(pluginDir)) {
  throw new Error(`Packaging source not found: ${pluginDir}`);
}

rmSync(zipPath, { force: true });

execFileSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${resolve(pluginDir)}\\*' -DestinationPath '${zipPath}' -Force`,
  ],
  { stdio: "inherit" },
);

process.stdout.write(`Created ${zipPath}\n`);
