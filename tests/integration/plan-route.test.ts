import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/plans/route";

describe("plan route", () => {
  it("exports a POST handler", () => {
    expect(typeof POST).toBe("function");
  });
});
