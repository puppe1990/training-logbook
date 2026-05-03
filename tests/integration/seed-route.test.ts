import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/seed/route";

describe("seed route", () => {
  it("exports POST as a function", () => {
    expect(POST).toEqual(expect.any(Function));
  });
});
