import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { createClient } from "@libsql/client";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/lib/db/schema";

function readAuthConfig() {
  return {
    secret:
      process.env.BETTER_AUTH_SECRET ??
      "better-auth-secret-that-is-long-enough-for-local-tests",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    databaseUrl: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    databaseAuthToken: process.env.TURSO_AUTH_TOKEN,
  };
}

const config = readAuthConfig();

const authDatabaseClient = createClient({
  url: config.databaseUrl,
  authToken: config.databaseAuthToken,
});

const authDatabase = drizzle(authDatabaseClient, { schema });

export const auth = betterAuth({
  secret: config.secret,
  baseURL: config.baseURL,
  database: drizzleAdapter(authDatabase, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: "users",
  },
});

export type Auth = typeof auth;
