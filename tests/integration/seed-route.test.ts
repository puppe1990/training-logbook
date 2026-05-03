import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/seed/route";

const { getSessionFromHeaders } = vi.hoisted(() => ({
  getSessionFromHeaders: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionFromHeaders,
}));

describe("seed route", () => {
  beforeEach(() => {
    getSessionFromHeaders.mockReset();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    getSessionFromHeaders.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/seed", { method: "POST" }),
    );

    expect(response.status).toBe(401);
  });
});
