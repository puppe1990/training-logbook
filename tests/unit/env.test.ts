import { describe, expect, it } from "vitest";

import { readDatabaseEnv, readEnv } from "@/lib/env";

describe("readEnv", () => {
  it("accepts a raw env object and returns required app variables", () => {
    const env = readEnv({
      TURSO_DATABASE_URL: "libsql://training-logbook.turso.io",
      TURSO_AUTH_TOKEN: "token-123",
      BETTER_AUTH_SECRET: "secret-123",
      BETTER_AUTH_URL: "http://localhost:3000",
    });

    expect(env).toEqual({
      tursoUrl: "libsql://training-logbook.turso.io",
      tursoAuthToken: "token-123",
      authSecret: "secret-123",
      authUrl: "http://localhost:3000",
    });
    expect(env.tursoUrl).toContain("turso.io");
    expect(env.authUrl).toBe("http://localhost:3000");
  });

  it("throws when a required variable is missing", () => {
    expect(() =>
      readEnv({
        TURSO_DATABASE_URL: "libsql://training-logbook.turso.io",
        TURSO_AUTH_TOKEN: "token-123",
        BETTER_AUTH_SECRET: "secret-123",
      }),
    ).toThrowError("Missing required environment variables");
  });

  it("reads database variables without requiring auth configuration", () => {
    const env = readDatabaseEnv({
      TURSO_DATABASE_URL: "libsql://training-logbook.turso.io",
      TURSO_AUTH_TOKEN: "token-123",
    });

    expect(env).toEqual({
      tursoUrl: "libsql://training-logbook.turso.io",
      tursoAuthToken: "token-123",
    });
  });
});
