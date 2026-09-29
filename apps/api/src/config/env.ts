import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

dotenv.config();
if (!process.env.DATABASE_URL) {
  const rootEnv = resolve(fileURLToPath(new URL("../../../../../.env", import.meta.url)));
  const workspaceEnv = resolve(process.cwd(), "../../.env");
  if (existsSync(workspaceEnv)) {
    dotenv.config({ path: workspaceEnv });
  } else if (existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
  }
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  ),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export const env = EnvSchema.parse(process.env);
