import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/session-entries/route";

describe("session entries route", () => {
  it("exports POST as a function", () => {
    expect(POST).toEqual(expect.any(Function));
  });
});
