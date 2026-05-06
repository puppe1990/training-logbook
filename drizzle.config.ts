import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;
const isLocalSqlite = databaseUrl.startsWith("file:");

if (!isLocalSqlite && !tursoAuthToken) {
  throw new Error("Missing TURSO_AUTH_TOKEN for drizzle-kit");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: isLocalSqlite ? "sqlite" : "turso",
  dbCredentials: isLocalSqlite
    ? {
        url: databaseUrl,
      }
    : {
        url: databaseUrl,
        authToken: tursoAuthToken,
      },
});
