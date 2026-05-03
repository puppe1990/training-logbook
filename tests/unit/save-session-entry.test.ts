import { describe, expect, it } from "vitest";

import { normalizeEntryPayload } from "@/lib/workouts/save-session-entry";

describe("normalizeEntryPayload", () => {
  it("normalizes numbers from form input", () => {
    const result = normalizeEntryPayload({
      setNumber: "1",
      performedReps: "12",
      weightValue: "80",
    });

    expect(result.setNumber).toBe(1);
    expect(result.performedReps).toBe(12);
    expect(result.weightValue).toBe(80);
  });
});
