import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/auth/[...all]/route";

describe("auth route", () => {
  it("exports GET as a function", () => {
    expect(GET).toEqual(expect.any(Function));
  });
});
