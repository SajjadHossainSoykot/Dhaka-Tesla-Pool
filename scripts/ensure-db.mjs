import { execSync } from "node:child_process";
import net from "node:net";
import os from "node:os";

// Ensure standard docker binary paths are included in PATH on macOS
const homeDir = os.homedir();
const extraPaths = [
  `${homeDir}/.docker/bin`,
  "/usr/local/bin",
  "/opt/homebrew/bin",
  "/Applications/Docker.app/Contents/Resources/bin",
];
process.env.PATH = `${extraPaths.join(":")}:${process.env.PATH || ""}`;

function isPortOpen(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  const open = await isPortOpen("127.0.0.1", 5432);
  if (!open) {
    console.log("⚡ PostgreSQL is not running on localhost:5432.");
    console.log("🐳 Starting database container via Docker Compose (docker compose up db -d)...");
    try {
      execSync("docker compose up db -d", { stdio: "inherit", env: process.env });
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (await isPortOpen("127.0.0.1", 5432)) {
          console.log("✅ PostgreSQL is ready on localhost:5432!\n");
          return;
        }
      }
    } catch (err) {
      console.warn("⚠️ Could not auto-start Docker container. Please ensure Docker is running or PostgreSQL is installed.");
    }
  } else {
    console.log("✅ PostgreSQL database detected on localhost:5432.\n");
  }
}

await main();
