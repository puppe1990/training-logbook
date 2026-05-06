import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createClient } from "@libsql/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/auth/[...all]/route";

const tempDirs: string[] = [];

async function applySqlFile(
  client: ReturnType<typeof createClient>,
  path: string,
) {
  const sql = await readFile(path, "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.execute(statement);
  }
}

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("auth route", () => {
  it("exports GET as a function", () => {
    expect(GET).toEqual(expect.any(Function));
  });

  it("creates an email signup account", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "training-logbook-auth-"));
    tempDirs.push(tempDir);

    const databasePath = join(tempDir, "auth.db");
    const client = createClient({ url: `file:${databasePath}` });

    await applySqlFile(client, join(process.cwd(), "drizzle/0000_initial.sql"));
    await applySqlFile(
      client,
      join(process.cwd(), "drizzle/0001_better-auth-schema.sql"),
    );

    vi.stubEnv("TURSO_DATABASE_URL", `file:${databasePath}`);
    vi.stubEnv(
      "BETTER_AUTH_SECRET",
      "better-auth-secret-that-is-long-enough-for-tests",
    );
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    vi.resetModules();

    const { POST } = await import("@/app/api/auth/[...all]/route");

    const response = await POST(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Gym User",
          email: "gym-user@example.com",
          password: "password123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: {
        email: "gym-user@example.com",
        name: "Gym User",
      },
    });
  });
});
