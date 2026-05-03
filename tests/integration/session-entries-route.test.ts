import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/session-entries/route";

const { db, getSessionFromHeaders } = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
  getSessionFromHeaders: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db,
}));

vi.mock("@/lib/session", () => ({
  getSessionFromHeaders,
}));

describe("session entries route", () => {
  beforeEach(() => {
    db.select.mockReset();
    db.update.mockReset();
    db.insert.mockReset();
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

  it("updates an existing entry when the same session exercise set is posted twice", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const selectLimit = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "entry-1",
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          setNumber: 1,
        },
      ]);
    const selectWhere = vi.fn(() => ({ limit: selectLimit }));
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    db.select.mockReturnValue({ from: selectFrom });

    const createdEntry = {
      id: "entry-1",
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: 1,
      performedReps: 8,
      weightValue: 50,
      targetRepsMin: null,
      targetRepsMax: null,
      note: null,
      isCompleted: false,
      dayExerciseId: null,
    };
    const updatedEntry = {
      id: "entry-1",
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: 1,
      performedReps: 10,
      weightValue: 55,
      targetRepsMin: null,
      targetRepsMax: null,
      note: null,
      isCompleted: true,
      dayExerciseId: null,
    };

    const updateReturning = vi.fn().mockResolvedValue([updatedEntry]);
    const updateWhere = vi.fn(() => ({ returning: updateReturning }));
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    db.update.mockReturnValue({ set: updateSet });

    const insertReturning = vi.fn().mockResolvedValue([createdEntry]);
    const insertValues = vi.fn(() => ({ returning: insertReturning }));
    db.insert.mockReturnValue({ values: insertValues });

    const firstPayload = {
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: "1",
      performedReps: "8",
      weightValue: "50",
      isCompleted: false,
    };
    const secondPayload = {
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: "1",
      performedReps: "10",
      weightValue: "55",
      isCompleted: true,
    };

    const firstResponse = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(firstPayload),
      }),
    );
    const secondResponse = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(secondPayload),
      }),
    );

    expect(firstResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toEqual({
      entry: createdEntry,
    });
    expect(secondResponse.status).toBe(200);
    await expect(secondResponse.json()).resolves.toEqual({
      entry: updatedEntry,
    });
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(updateSet).toHaveBeenCalledWith({
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: 1,
      performedReps: 10,
      weightValue: 55,
      targetRepsMin: null,
      targetRepsMax: null,
      note: null,
      isCompleted: true,
      dayExerciseId: null,
    });
  });
});
