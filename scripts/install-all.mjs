import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const npmCommand = "npm";
const projects = ["backend", "frontend"];

for (const project of projects) {
  const cwd = fileURLToPath(new URL(`../${project}/`, import.meta.url));
  const result = spawnSync(npmCommand, ["ci", "--ignore-scripts"], {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  if (result.error) {
    console.error(`Failed to install ${project} dependencies: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
