import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local for local development (Next.js convention)
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
