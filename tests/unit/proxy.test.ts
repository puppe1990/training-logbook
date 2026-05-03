import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import proxy from "../../proxy";

const { getSessionFromHeaders } = vi.hoisted(() => ({
  getSessionFromHeaders: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionFromHeaders,
}));

describe("proxy", () => {
  beforeEach(() => {
    getSessionFromHeaders.mockReset();
  });

  it("redirects unauthenticated users from protected routes to root", async () => {
    getSessionFromHeaders.mockResolvedValue(null);

    const response = await proxy(
      new NextRequest("http://localhost:3000/today"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects authenticated users away from public auth routes", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const response = await proxy(
      new NextRequest("http://localhost:3000/signup"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/today",
    );
  });
});
