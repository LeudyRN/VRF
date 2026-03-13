import { spawn } from "node:child_process";

const processes = [
  {
    name: "backend",
    cwd: new URL("../backend/", import.meta.url),
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "dev"],
  },
  {
    name: "frontend",
    cwd: new URL("../auth-front/", import.meta.url),
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "dev"],
  },
];

const children = processes.map((processConfig) => {
  const child = spawn(processConfig.command, processConfig.args, {
    cwd: processConfig.cwd,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
});

function shutdown(signal) {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
