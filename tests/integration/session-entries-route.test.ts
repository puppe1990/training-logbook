import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/session-entries/route";

const { getSessionFromHeaders } = vi.hoisted(() => ({
  getSessionFromHeaders: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionFromHeaders,
}));

describe("session entries route", () => {
  beforeEach(() => {
    getSessionFromHeaders.mockReset();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    getSessionFromHeaders.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
  });
});
