import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createClient } from "@libsql/client";
import { afterEach, describe, expect, it } from "vitest";

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
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("auth schema migration", () => {
  it("rebuilds users without the legacy auth_provider_user_id column", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "training-logbook-auth-"));
    tempDirs.push(tempDir);

    const databasePath = join(tempDir, "migration.db");
    const client = createClient({ url: `file:${databasePath}` });

    await applySqlFile(client, join(process.cwd(), "drizzle/0000_initial.sql"));
    await applySqlFile(
      client,
      join(process.cwd(), "drizzle/0001_better-auth-schema.sql"),
    );

    const usersColumns = await client.execute(
      "select name from pragma_table_info('users') order by cid",
    );

    expect(usersColumns.rows.map((row) => row.name)).toEqual([
      "id",
      "name",
      "email",
      "emailVerified",
      "image",
      "createdAt",
      "updatedAt",
    ]);
  });
});
