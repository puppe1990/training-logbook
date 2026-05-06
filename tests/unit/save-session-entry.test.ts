import { describe, expect, it } from "vitest";

import {
  buildEntryRequestBody,
  getSaveStateLabel,
  normalizeEntryPayload,
} from "@/lib/workouts/save-session-entry";

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

  it("turns blank strings into null optional values", () => {
    const result = normalizeEntryPayload({
      setNumber: "1",
      performedReps: "",
      weightValue: "   ",
    });

    expect(result.performedReps).toBeNull();
    expect(result.weightValue).toBeNull();
  });

  it("rejects invalid whole numbers", () => {
    expect(() =>
      normalizeEntryPayload({
        setNumber: "one",
        performedReps: "12",
        weightValue: "80",
      }),
    ).toThrow(/whole number/i);
  });

  it("rejects invalid optional numeric strings", () => {
    expect(() =>
      normalizeEntryPayload({
        setNumber: "1",
        performedReps: "eight",
        weightValue: "80",
      }),
    ).toThrow(/whole number/i);
  });
});

describe("buildEntryRequestBody", () => {
  it("builds the session entry request body from draft values", () => {
    expect(
      buildEntryRequestBody({
        workoutSessionId: null,
        dayExerciseId: "de-1",
        exerciseId: "ex-1",
        setNumber: 2,
        targetRepsMin: 6,
        targetRepsMax: 10,
        performedReps: "8",
        weightValue: "70",
        isCompleted: true,
      }),
    ).toEqual({
      dayExerciseId: "de-1",
      exerciseId: "ex-1",
      setNumber: "2",
      targetRepsMin: 6,
      targetRepsMax: 10,
      performedReps: "8",
      weightValue: "70",
      isCompleted: true,
    });
  });
});

describe("getSaveStateLabel", () => {
  it("maps save states to user-facing labels", () => {
    expect(getSaveStateLabel("idle")).toBe("Ready");
    expect(getSaveStateLabel("dirty")).toBe("Not saved");
    expect(getSaveStateLabel("saving")).toBe("Saving");
    expect(getSaveStateLabel("saved")).toBe("Saved");
    expect(getSaveStateLabel("error")).toBe("Error");
  });
});
