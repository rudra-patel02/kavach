import { spawn } from "node:child_process";

const npmCommand = "npm";

const processes = [
  ["backend", ["--prefix", "backend", "run", "dev"]],
  ["frontend", ["--prefix", "frontend", "run", "dev"]],
].map(([name, args]) => {
  const child = spawn(npmCommand, args, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`${name} dev server stopped with ${signal}`);
      shutdown(1);
      return;
    }

    if (code !== 0) {
      console.error(`${name} dev server exited with code ${code}`);
      shutdown(code ?? 1);
    }
  });

  return child;
});

let shuttingDown = false;

const shutdown = (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exitCode = exitCode;
};

process.once("SIGINT", () => shutdown(0));
process.once("SIGTERM", () => shutdown(0));
