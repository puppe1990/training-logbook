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

function getSqlColumnsAndValues(expression: unknown) {
  const columns: string[] = [];
  const text: string[] = [];
  const values: Array<string | number | null> = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }

      return;
    }

    if ("name" in node && typeof node.name === "string") {
      columns.push(node.name);
    }

    if (
      "value" in node &&
      Array.isArray(node.value) &&
      node.value.every((value) => typeof value === "string")
    ) {
      text.push(node.value.join(""));
    }

    if (
      "value" in node &&
      (typeof node.value === "string" ||
        typeof node.value === "number" ||
        node.value === null)
    ) {
      values.push(node.value);
    }

    if ("queryChunks" in node && Array.isArray(node.queryChunks)) {
      walk(node.queryChunks);
    }
  }

  walk(expression);

  return {
    columns,
    text: text.join(""),
    values,
  };
}

function buildSelectChain(rows: unknown[], joinCount = 0) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ limit }));
  const query: {
    from: ReturnType<typeof vi.fn>;
    where?: ReturnType<typeof vi.fn>;
    innerJoin?: ReturnType<typeof vi.fn>;
  } = {
    from: vi.fn(() => query),
    where,
  };

  if (joinCount > 0) {
    query.innerJoin = vi.fn(() => query);
  }

  return query;
}

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

  it("returns 400 when setNumber is invalid", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          dayExerciseId: "de-1",
          setNumber: "zero",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid session entry payload",
    });
  });

  it("returns 400 when optional numeric fields are invalid", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          dayExerciseId: "de-1",
          setNumber: "1",
          performedReps: "eight",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid session entry payload",
    });
  });

  it("returns 400 when the workout session does not belong to the signed-in user", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });
    db.select.mockReturnValueOnce(buildSelectChain([]));

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-foreign",
          exerciseId: "exercise-1",
          setNumber: "1",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing session entry identifiers",
    });
  });

  it("returns 400 when dayExerciseId and exerciseId do not match", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });
    db.select.mockReturnValueOnce(
      buildSelectChain(
        [{ exerciseId: "exercise-2", workoutDayId: "day-1" }],
        2,
      ),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          dayExerciseId: "de-1",
          setNumber: "1",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing session entry identifiers",
    });
  });

  it("creates a workout session on first save when session id is missing", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const dayExerciseLookup = buildSelectChain(
      [{ exerciseId: "exercise-1", workoutDayId: "day-1" }],
      2,
    );
    const sessionLookup = buildSelectChain([]);
    const explicitEntryLookup = buildSelectChain([]);
    const legacyEntryLookup = buildSelectChain([]);

    db.select
      .mockReturnValueOnce(dayExerciseLookup)
      .mockReturnValueOnce(sessionLookup)
      .mockReturnValueOnce(explicitEntryLookup)
      .mockReturnValueOnce(legacyEntryLookup);

    const insertReturning = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "session-1",
          userId: "user-1",
          workoutDayId: "day-1",
          performedOn: "2026-05-03",
          sessionNote: null,
          status: "in_progress",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "entry-1",
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          dayExerciseId: "de-1",
          setNumber: 1,
          performedReps: 8,
          weightValue: 70,
          targetRepsMin: 6,
          targetRepsMax: 10,
          note: null,
          isCompleted: true,
        },
      ]);
    const insertValues = vi.fn(() => ({ returning: insertReturning }));
    db.insert.mockReturnValue({ values: insertValues });

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          exerciseId: "exercise-1",
          dayExerciseId: "de-1",
          setNumber: "1",
          performedReps: "8",
          weightValue: "70",
          targetRepsMin: 6,
          targetRepsMax: 10,
          isCompleted: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      entry: {
        id: "entry-1",
        workoutSessionId: "session-1",
        exerciseId: "exercise-1",
        dayExerciseId: "de-1",
        setNumber: 1,
        performedReps: 8,
        weightValue: 70,
        targetRepsMin: 6,
        targetRepsMax: 10,
        note: null,
        isCompleted: true,
      },
    });
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("returns 400 when setNumber is not a positive integer", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          setNumber: "0",
          performedReps: "10",
          weightValue: "55",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid session entry payload",
    });
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("accepts blank optional numeric fields as null", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const selectLimit = vi.fn().mockResolvedValue([]);
    const selectWhere = vi.fn(() => ({ limit: selectLimit }));
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    db.select
      .mockReturnValueOnce(
        buildSelectChain([{ id: "session-1", workoutDayId: "day-1" }]),
      )
      .mockReturnValue({ from: selectFrom });

    const createdEntry = {
      id: "entry-1",
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: 1,
      dayExerciseId: null,
      performedReps: null,
      weightValue: null,
      targetRepsMin: null,
      targetRepsMax: null,
      note: null,
      isCompleted: false,
    };

    const insertReturning = vi.fn().mockResolvedValue([createdEntry]);
    const insertValues = vi.fn(() => ({ returning: insertReturning }));
    db.insert.mockReturnValue({ values: insertValues });

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          setNumber: "1",
          performedReps: "",
          weightValue: "",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        performedReps: null,
        weightValue: null,
      }),
    );
  });

  it("updates an existing entry when the same session exercise set is posted twice", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const whereClauses: Array<ReturnType<typeof getSqlColumnsAndValues>> = [];
    const selectLimit = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "entry-1",
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          setNumber: 1,
          dayExerciseId: "de-1",
        },
      ]);
    const selectWhere = vi.fn((expression: unknown) => {
      whereClauses.push(getSqlColumnsAndValues(expression));

      return { limit: selectLimit };
    });
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    db.select
      .mockReturnValueOnce(
        buildSelectChain(
          [{ exerciseId: "exercise-1", workoutDayId: "day-1" }],
          2,
        ),
      )
      .mockReturnValueOnce(
        buildSelectChain([{ id: "session-1", workoutDayId: "day-1" }]),
      )
      .mockReturnValueOnce({ from: selectFrom })
      .mockReturnValueOnce({ from: selectFrom })
      .mockReturnValueOnce(
        buildSelectChain(
          [{ exerciseId: "exercise-1", workoutDayId: "day-1" }],
          2,
        ),
      )
      .mockReturnValueOnce(
        buildSelectChain([{ id: "session-1", workoutDayId: "day-1" }]),
      )
      .mockReturnValueOnce({ from: selectFrom });

    const createdEntry = {
      id: "entry-1",
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: 1,
      dayExerciseId: "de-1",
      performedReps: 8,
      weightValue: 50,
      targetRepsMin: null,
      targetRepsMax: null,
      note: null,
      isCompleted: false,
    };
    const updatedEntry = {
      id: "entry-1",
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: 1,
      dayExerciseId: null,
      performedReps: 10,
      weightValue: 55,
      targetRepsMin: null,
      targetRepsMax: null,
      note: null,
      isCompleted: true,
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
      dayExerciseId: "de-1",
      setNumber: "1",
      performedReps: "8",
      weightValue: "50",
      isCompleted: false,
    };
    const secondPayload = {
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      dayExerciseId: "de-1",
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
    expect(whereClauses).toHaveLength(3);
    expect(whereClauses[0]).toEqual(
      expect.objectContaining({
        columns: expect.arrayContaining(["day_exercise_id"]),
        values: expect.arrayContaining(["de-1"]),
      }),
    );
    expect(whereClauses[1]).toEqual(
      expect.objectContaining({
        columns: expect.arrayContaining(["day_exercise_id", "exercise_id"]),
      }),
    );
    expect(whereClauses[1]?.values).not.toContain("de-1");
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
      dayExerciseId: "de-1",
    });
  });

  it("updates an existing entry when dayExerciseId is omitted on repeated posts", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const whereClauses: Array<ReturnType<typeof getSqlColumnsAndValues>> = [];
    const selectLimit = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "entry-1",
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          setNumber: 1,
          dayExerciseId: null,
        },
      ]);
    const selectWhere = vi.fn((expression: unknown) => {
      whereClauses.push(getSqlColumnsAndValues(expression));

      return { limit: selectLimit };
    });
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    db.select
      .mockReturnValueOnce(
        buildSelectChain([{ id: "session-1", workoutDayId: "day-1" }]),
      )
      .mockReturnValueOnce({ from: selectFrom })
      .mockReturnValueOnce(
        buildSelectChain([{ id: "session-1", workoutDayId: "day-1" }]),
      )
      .mockReturnValueOnce({ from: selectFrom });

    const createdEntry = {
      id: "entry-1",
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: 1,
      dayExerciseId: null,
      performedReps: 8,
      weightValue: 50,
      targetRepsMin: null,
      targetRepsMax: null,
      note: null,
      isCompleted: false,
    };
    const updatedEntry = {
      id: "entry-1",
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: 1,
      dayExerciseId: "de-1",
      performedReps: 10,
      weightValue: 55,
      targetRepsMin: null,
      targetRepsMax: null,
      note: null,
      isCompleted: true,
    };

    const updateReturning = vi.fn().mockResolvedValue([updatedEntry]);
    const updateWhere = vi.fn(() => ({ returning: updateReturning }));
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    db.update.mockReturnValue({ set: updateSet });

    const insertReturning = vi.fn().mockResolvedValue([createdEntry]);
    const insertValues = vi.fn(() => ({ returning: insertReturning }));
    db.insert.mockReturnValue({ values: insertValues });

    const firstResponse = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          setNumber: "1",
          performedReps: "8",
          weightValue: "50",
          isCompleted: false,
        }),
      }),
    );
    const secondResponse = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          setNumber: "1",
          performedReps: "10",
          weightValue: "55",
          isCompleted: true,
        }),
      }),
    );

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    await expect(firstResponse.json()).resolves.toEqual({
      entry: createdEntry,
    });
    await expect(secondResponse.json()).resolves.toEqual({
      entry: updatedEntry,
    });
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(whereClauses).toHaveLength(2);
    expect(whereClauses[0]).toEqual(
      expect.objectContaining({
        columns: expect.arrayContaining(["exercise_id"]),
        values: expect.arrayContaining(["exercise-1", 1, "session-1"]),
      }),
    );
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

  it("updates an existing explicit slot entry when a repeated post omits dayExerciseId", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const whereClauses: Array<ReturnType<typeof getSqlColumnsAndValues>> = [];
    const selectLimit = vi.fn().mockResolvedValueOnce([
      {
        id: "entry-1",
        workoutSessionId: "session-1",
        exerciseId: "exercise-1",
        setNumber: 1,
        dayExerciseId: "de-1",
      },
    ]);
    const selectWhere = vi.fn((expression: unknown) => {
      whereClauses.push(getSqlColumnsAndValues(expression));

      return { limit: selectLimit };
    });
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    db.select
      .mockReturnValueOnce(
        buildSelectChain([{ id: "session-1", workoutDayId: "day-1" }]),
      )
      .mockReturnValueOnce({ from: selectFrom });

    const updatedEntry = {
      id: "entry-1",
      workoutSessionId: "session-1",
      exerciseId: "exercise-1",
      setNumber: 1,
      dayExerciseId: "de-1",
      performedReps: 10,
      weightValue: 55,
      targetRepsMin: null,
      targetRepsMax: null,
      note: null,
      isCompleted: true,
    };

    const updateReturning = vi.fn().mockResolvedValue([updatedEntry]);
    const updateWhere = vi.fn(() => ({ returning: updateReturning }));
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    db.update.mockReturnValue({ set: updateSet });

    const insertValues = vi.fn();
    db.insert.mockReturnValue({ values: insertValues });

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          setNumber: "1",
          performedReps: "10",
          weightValue: "55",
          isCompleted: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      entry: updatedEntry,
    });
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(whereClauses).toHaveLength(1);
    expect(whereClauses[0]).toEqual(
      expect.objectContaining({
        columns: expect.arrayContaining(["exercise_id"]),
        values: expect.arrayContaining(["session-1", "exercise-1", 1]),
      }),
    );
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
      dayExerciseId: "de-1",
    });
  });

  it("returns 409 when an omitted dayExerciseId matches multiple explicit slots", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const selectLimit = vi.fn().mockResolvedValueOnce([
      {
        id: "entry-1",
        workoutSessionId: "session-1",
        exerciseId: "exercise-1",
        setNumber: 1,
        dayExerciseId: "de-1",
      },
      {
        id: "entry-2",
        workoutSessionId: "session-1",
        exerciseId: "exercise-1",
        setNumber: 1,
        dayExerciseId: "de-2",
      },
    ]);
    const selectWhere = vi.fn(() => ({ limit: selectLimit }));
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    db.select
      .mockReturnValueOnce(
        buildSelectChain([{ id: "session-1", workoutDayId: "day-1" }]),
      )
      .mockReturnValueOnce({ from: selectFrom });

    const response = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          setNumber: "1",
          performedReps: "10",
          weightValue: "55",
          isCompleted: true,
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Ambiguous session entry identifiers",
    });
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("creates separate entries for duplicate exercise slots with different dayExerciseId values", async () => {
    getSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });

    const storedEntries: Array<{
      id: string;
      workoutSessionId: string;
      exerciseId: string;
      setNumber: number;
      performedReps: number | null;
      weightValue: number | null;
      targetRepsMin: number | null;
      targetRepsMax: number | null;
      note: string | null;
      isCompleted: boolean;
      dayExerciseId: string | null;
    }> = [];
    const whereClauses: Array<ReturnType<typeof getSqlColumnsAndValues>> = [];

    const selectWhere = vi.fn((expression: unknown) => {
      const clause = getSqlColumnsAndValues(expression);
      whereClauses.push(clause);

      const requestedSessionId = clause.values.find(
        (value) => typeof value === "string" && value.startsWith("session-"),
      );
      const requestedExerciseId = clause.values.find(
        (value) => typeof value === "string" && value.startsWith("exercise-"),
      );
      const requestedDayExerciseId = clause.values.find(
        (value) => typeof value === "string" && value.startsWith("de-"),
      );
      const requestedSetNumber = clause.values.find(
        (value) => typeof value === "number",
      );
      const requiresNullDayExerciseId =
        clause.columns.includes("day_exercise_id") &&
        !clause.values.some(
          (value) => typeof value === "string" && value.startsWith("de-"),
        );

      const existingEntry = storedEntries.find((entry) => {
        if (
          entry.workoutSessionId !== requestedSessionId ||
          entry.setNumber !== requestedSetNumber
        ) {
          return false;
        }

        if (requestedDayExerciseId) {
          return entry.dayExerciseId === requestedDayExerciseId;
        }

        if (requiresNullDayExerciseId) {
          return (
            entry.dayExerciseId === null &&
            entry.exerciseId === requestedExerciseId
          );
        }

        return entry.exerciseId === requestedExerciseId;
      });

      return {
        limit: vi.fn().mockResolvedValue(existingEntry ? [existingEntry] : []),
      };
    });
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    db.select
      .mockReturnValueOnce(
        buildSelectChain(
          [{ exerciseId: "exercise-1", workoutDayId: "day-1" }],
          2,
        ),
      )
      .mockReturnValueOnce(
        buildSelectChain([{ id: "session-1", workoutDayId: "day-1" }]),
      )
      .mockReturnValueOnce({ from: selectFrom })
      .mockReturnValueOnce({ from: selectFrom })
      .mockReturnValueOnce(
        buildSelectChain(
          [{ exerciseId: "exercise-1", workoutDayId: "day-1" }],
          2,
        ),
      )
      .mockReturnValueOnce(
        buildSelectChain([{ id: "session-1", workoutDayId: "day-1" }]),
      )
      .mockReturnValueOnce({ from: selectFrom })
      .mockReturnValueOnce({ from: selectFrom });

    const updateReturning = vi.fn(async () => {
      const updatedEntry = storedEntries.at(-1);

      return updatedEntry ? [updatedEntry] : [];
    });
    const updateWhere = vi.fn(() => ({ returning: updateReturning }));
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    db.update.mockReturnValue({ set: updateSet });

    const insertReturning = vi.fn(async () => {
      const createdEntry = storedEntries.at(-1);

      return createdEntry ? [createdEntry] : [];
    });
    const insertValues = vi.fn((entry) => {
      storedEntries.push(entry);

      return { returning: insertReturning };
    });
    db.insert.mockReturnValue({ values: insertValues });

    const firstResponse = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          dayExerciseId: "de-1",
          setNumber: "1",
          performedReps: "8",
          weightValue: "50",
          isCompleted: true,
        }),
      }),
    );
    const secondResponse = await POST(
      new Request("http://localhost:3000/api/session-entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          workoutSessionId: "session-1",
          exerciseId: "exercise-1",
          dayExerciseId: "de-2",
          setNumber: "1",
          performedReps: "10",
          weightValue: "55",
          isCompleted: true,
        }),
      }),
    );

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(db.update).not.toHaveBeenCalled();
    expect(whereClauses).toHaveLength(4);
    expect(whereClauses[0]?.values).toContain("de-1");
    expect(whereClauses[1]?.values).not.toContain("de-1");
    expect(whereClauses[2]?.values).toContain("de-2");
    expect(whereClauses[3]?.values).not.toContain("de-2");
    expect(storedEntries).toHaveLength(2);
    expect(storedEntries.map((entry) => entry.dayExerciseId)).toEqual([
      "de-1",
      "de-2",
    ]);
  });
});
