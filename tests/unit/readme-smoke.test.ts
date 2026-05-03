import fs from "node:fs";

import { describe, expect, it } from "vitest";

describe("README", () => {
  it("documents setup and database commands", () => {
    const readme = fs.readFileSync("README.md", "utf8");

    expect(readme).toMatch(/pnpm install/);
    expect(readme).toMatch(/pnpm db:migrate/);
    expect(readme).toMatch(/pnpm dev/);
  });
});
