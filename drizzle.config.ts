import { defineConfig } from "drizzle-kit";

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoDatabaseUrl) {
  throw new Error("Missing TURSO_DATABASE_URL for drizzle-kit");
}

if (!tursoAuthToken) {
  throw new Error("Missing TURSO_AUTH_TOKEN for drizzle-kit");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: tursoDatabaseUrl,
    authToken: tursoAuthToken,
  },
});
