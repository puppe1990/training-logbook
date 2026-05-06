import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  db,
}));

import {
  buildTodayWorkoutViewModel,
  getTodayWorkout,
} from "@/lib/workouts/get-today-workout";

function getSqlColumnsAndValues(expression: unknown) {
  const columns: string[] = [];
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

  return { columns, values };
}

function mockTodayWorkoutRows(rows: unknown[]) {
  const query = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
  };

  query.from.mockReturnValue(query);
  query.innerJoin.mockReturnValue(query);
  query.leftJoin.mockReturnValue(query);
  query.where.mockReturnValue(query);
  query.orderBy.mockResolvedValue(rows);

  db.select.mockReturnValue(query);

  return query;
}

describe("buildTodayWorkoutViewModel", () => {
  beforeEach(() => {
    db.select.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds a sorted today workout view model from prescribed and logged sets", () => {
    const result = buildTodayWorkoutViewModel({
      dayName: "Upper 1",
      sessionId: "session-1",
      exercises: [
        {
          dayExerciseId: "de-2",
          exerciseId: "ex-2",
          sortOrder: 2,
          name: "Puxada aberta maquina/barra",
          prescribedSets: 2,
          repMin: 8,
          repMax: 12,
          imageUrl: null,
          previousPerformance: null,
          loggedSets: [
            {
              setNumber: 1,
              performedReps: 12,
              weightValue: 40,
              isCompleted: true,
            },
          ],
        },
        {
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          sortOrder: 1,
          name: "Supino reto maquina",
          prescribedSets: 3,
          repMin: 6,
          repMax: 10,
          imageUrl: "https://example.com/supino.jpg",
          previousPerformance: { performedReps: 8, weightValue: 70 },
          loggedSets: [],
        },
      ],
    });

    expect(result).toEqual({
      dayName: "Upper 1",
      sessionId: "session-1",
      completedExerciseCount: 0,
      totalExerciseCount: 2,
      exercises: [
        {
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          sortOrder: 1,
          name: "Supino reto maquina",
          imageUrl: "https://example.com/supino.jpg",
          previousPerformance: { performedReps: 8, weightValue: 70 },
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
            {
              setNumber: 2,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
            {
              setNumber: 3,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        },
        {
          dayExerciseId: "de-2",
          exerciseId: "ex-2",
          sortOrder: 2,
          name: "Puxada aberta maquina/barra",
          imageUrl: null,
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 8,
              targetRepsMax: 12,
              performedReps: 12,
              weightValue: 40,
              isCompleted: true,
            },
            {
              setNumber: 2,
              targetRepsMin: 8,
              targetRepsMax: 12,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        },
      ],
    });
  });

  it("marks an exercise as completed only when every prescribed set is completed", () => {
    const result = buildTodayWorkoutViewModel({
      dayName: "Upper 1",
      sessionId: "session-1",
      exercises: [
        {
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          sortOrder: 1,
          name: "Supino reto maquina",
          prescribedSets: 2,
          repMin: 6,
          repMax: 10,
          imageUrl: null,
          previousPerformance: null,
          loggedSets: [
            {
              setNumber: 1,
              performedReps: 8,
              weightValue: 70,
              isCompleted: true,
            },
            {
              setNumber: 2,
              performedReps: 7,
              weightValue: 70,
              isCompleted: true,
            },
          ],
        },
      ],
    });

    expect(result.completedExerciseCount).toBe(1);
    expect(result.totalExerciseCount).toBe(1);
    expect(result.exercises[0]?.isExerciseCompleted).toBe(true);
  });

  it("throws when logged sets exceed prescribed sets", () => {
    expect(() =>
      buildTodayWorkoutViewModel({
        dayName: "Upper 1",
        sessionId: "session-1",
        exercises: [
          {
            dayExerciseId: "de-1",
            exerciseId: "ex-1",
            sortOrder: 1,
            name: "Supino reto maquina",
            prescribedSets: 2,
            repMin: 6,
            repMax: 10,
            imageUrl: null,
            previousPerformance: null,
            loggedSets: [
              {
                setNumber: 1,
                performedReps: 8,
                weightValue: 70,
                isCompleted: true,
              },
              {
                setNumber: 3,
                performedReps: 7,
                weightValue: 70,
                isCompleted: true,
              },
            ],
          },
        ],
      }),
    ).toThrow(/exceeds prescribed sets/i);
  });

  it("throws when logged sets contain duplicate set numbers", () => {
    expect(() =>
      buildTodayWorkoutViewModel({
        dayName: "Upper 1",
        sessionId: "session-1",
        exercises: [
          {
            dayExerciseId: "de-1",
            exerciseId: "ex-1",
            sortOrder: 1,
            name: "Supino reto maquina",
            prescribedSets: 2,
            repMin: 6,
            repMax: 10,
            imageUrl: null,
            previousPerformance: null,
            loggedSets: [
              {
                setNumber: 1,
                performedReps: 8,
                weightValue: 70,
                isCompleted: true,
              },
              {
                setNumber: 1,
                performedReps: 9,
                weightValue: 72,
                isCompleted: true,
              },
            ],
          },
        ],
      }),
    ).toThrow(/duplicate set number/i);
  });

  it("returns null when there is no active workout day for the weekday", async () => {
    mockTodayWorkoutRows([]);

    await expect(getTodayWorkout("user-1", 1)).resolves.toBeNull();
  });

  it("uses the provided weekday while keeping performed-on derived from one current date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 4, 9, 30, 0));

    const query = mockTodayWorkoutRows([]);

    await expect(getTodayWorkout("user-1", 0)).resolves.toBeNull();

    const workoutDayJoin = query.innerJoin.mock.calls[0]?.[1];
    const workoutSessionJoin = query.leftJoin.mock.calls[1]?.[1];

    expect(getSqlColumnsAndValues(workoutDayJoin)).toEqual(
      expect.objectContaining({
        columns: expect.arrayContaining(["weekday"]),
        values: expect.arrayContaining([0]),
      }),
    );
    expect(getSqlColumnsAndValues(workoutSessionJoin)).toEqual(
      expect.objectContaining({
        columns: expect.arrayContaining(["performed_on"]),
        values: expect.arrayContaining(["2026-05-04"]),
      }),
    );
  });

  it("returns the workout day with a null session id when no session exists for today", async () => {
    mockTodayWorkoutRows([
      {
        dayName: "Upper 1",
        sessionId: null,
        dayExerciseId: "de-2",
        exerciseId: "ex-2",
        sortOrder: 2,
        exerciseName: "Puxada aberta maquina/barra",
        prescribedSets: 2,
        repMin: 8,
        repMax: 12,
        imageUrl: null,
        entrySetNumber: null,
        entryPerformedReps: null,
        entryWeightValue: null,
        entryIsCompleted: null,
      },
      {
        dayName: "Upper 1",
        sessionId: null,
        dayExerciseId: "de-1",
        exerciseId: "ex-1",
        sortOrder: 1,
        exerciseName: "Supino reto maquina",
        prescribedSets: 3,
        repMin: 6,
        repMax: 10,
        imageUrl: "https://example.com/supino.jpg",
        entrySetNumber: null,
        entryPerformedReps: null,
        entryWeightValue: null,
        entryIsCompleted: null,
      },
    ]);

    await expect(getTodayWorkout("user-1", 1)).resolves.toEqual({
      dayName: "Upper 1",
      sessionId: null,
      completedExerciseCount: 0,
      totalExerciseCount: 2,
      exercises: [
        {
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          sortOrder: 1,
          name: "Supino reto maquina",
          imageUrl: "https://example.com/supino.jpg",
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
            {
              setNumber: 2,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
            {
              setNumber: 3,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        },
        {
          dayExerciseId: "de-2",
          exerciseId: "ex-2",
          sortOrder: 2,
          name: "Puxada aberta maquina/barra",
          imageUrl: null,
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 8,
              targetRepsMax: 12,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
            {
              setNumber: 2,
              targetRepsMin: 8,
              targetRepsMax: 12,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        },
      ],
    });
  });

  it("groups matching session entries into the current workout session", async () => {
    mockTodayWorkoutRows([
      {
        dayName: "Upper 1",
        sessionId: "session-1",
        dayExerciseId: "de-1",
        exerciseId: "ex-1",
        sortOrder: 1,
        exerciseName: "Supino reto maquina",
        prescribedSets: 2,
        repMin: 6,
        repMax: 10,
        imageUrl: "https://example.com/supino.jpg",
        entryDayExerciseId: "de-1",
        entryExerciseId: "ex-1",
        entrySetNumber: 1,
        entryPerformedReps: 8,
        entryWeightValue: 70,
        entryIsCompleted: true,
      },
      {
        dayName: "Upper 1",
        sessionId: "session-1",
        dayExerciseId: "de-1",
        exerciseId: "ex-1",
        sortOrder: 1,
        exerciseName: "Supino reto maquina",
        prescribedSets: 2,
        repMin: 6,
        repMax: 10,
        imageUrl: "https://example.com/supino.jpg",
        entryDayExerciseId: "de-1",
        entryExerciseId: "ex-1",
        entrySetNumber: 2,
        entryPerformedReps: 7,
        entryWeightValue: 70,
        entryIsCompleted: true,
      },
    ]);

    await expect(getTodayWorkout("user-1", 1)).resolves.toEqual({
      dayName: "Upper 1",
      sessionId: "session-1",
      completedExerciseCount: 1,
      totalExerciseCount: 1,
      exercises: [
        {
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          sortOrder: 1,
          name: "Supino reto maquina",
          imageUrl: "https://example.com/supino.jpg",
          previousPerformance: null,
          isExerciseCompleted: true,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: 8,
              weightValue: 70,
              isCompleted: true,
            },
            {
              setNumber: 2,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: 7,
              weightValue: 70,
              isCompleted: true,
            },
          ],
        },
      ],
    });
  });

  it("ignores session entry rows that belong to a different exercise in the same session", async () => {
    mockTodayWorkoutRows([
      {
        dayName: "Upper 1",
        sessionId: "session-1",
        dayExerciseId: "de-1",
        exerciseId: "ex-1",
        sortOrder: 1,
        exerciseName: "Supino reto maquina",
        prescribedSets: 2,
        repMin: 6,
        repMax: 10,
        imageUrl: "https://example.com/supino.jpg",
        entryDayExerciseId: "de-1",
        entryExerciseId: "ex-1",
        entrySetNumber: 1,
        entryPerformedReps: 8,
        entryWeightValue: 70,
        entryIsCompleted: true,
      },
      {
        dayName: "Upper 1",
        sessionId: "session-1",
        dayExerciseId: "de-1",
        exerciseId: "ex-1",
        sortOrder: 1,
        exerciseName: "Supino reto maquina",
        prescribedSets: 2,
        repMin: 6,
        repMax: 10,
        imageUrl: "https://example.com/supino.jpg",
        entryDayExerciseId: "de-2",
        entryExerciseId: "ex-2",
        entrySetNumber: 1,
        entryPerformedReps: 12,
        entryWeightValue: 40,
        entryIsCompleted: true,
      },
      {
        dayName: "Upper 1",
        sessionId: "session-1",
        dayExerciseId: "de-2",
        exerciseId: "ex-2",
        sortOrder: 2,
        exerciseName: "Puxada aberta maquina/barra",
        prescribedSets: 2,
        repMin: 8,
        repMax: 12,
        imageUrl: null,
        entryDayExerciseId: "de-2",
        entryExerciseId: "ex-2",
        entrySetNumber: 1,
        entryPerformedReps: 12,
        entryWeightValue: 40,
        entryIsCompleted: true,
      },
      {
        dayName: "Upper 1",
        sessionId: "session-1",
        dayExerciseId: "de-2",
        exerciseId: "ex-2",
        sortOrder: 2,
        exerciseName: "Puxada aberta maquina/barra",
        prescribedSets: 2,
        repMin: 8,
        repMax: 12,
        imageUrl: null,
        entryDayExerciseId: "de-1",
        entryExerciseId: "ex-1",
        entrySetNumber: 1,
        entryPerformedReps: 8,
        entryWeightValue: 70,
        entryIsCompleted: true,
      },
    ]);

    await expect(getTodayWorkout("user-1", 1)).resolves.toEqual({
      dayName: "Upper 1",
      sessionId: "session-1",
      completedExerciseCount: 0,
      totalExerciseCount: 2,
      exercises: [
        {
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          sortOrder: 1,
          name: "Supino reto maquina",
          imageUrl: "https://example.com/supino.jpg",
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: 8,
              weightValue: 70,
              isCompleted: true,
            },
            {
              setNumber: 2,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        },
        {
          dayExerciseId: "de-2",
          exerciseId: "ex-2",
          sortOrder: 2,
          name: "Puxada aberta maquina/barra",
          imageUrl: null,
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 8,
              targetRepsMax: 12,
              performedReps: 12,
              weightValue: 40,
              isCompleted: true,
            },
            {
              setNumber: 2,
              targetRepsMin: 8,
              targetRepsMax: 12,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        },
      ],
    });
  });

  it("does not duplicate an ambiguous legacy entry across repeated exercise slots", async () => {
    mockTodayWorkoutRows([
      {
        dayName: "Upper 1",
        sessionId: "session-1",
        dayExerciseId: "de-1",
        exerciseId: "ex-1",
        sortOrder: 1,
        exerciseName: "Supino reto maquina",
        prescribedSets: 2,
        repMin: 6,
        repMax: 10,
        imageUrl: "https://example.com/supino.jpg",
        entryDayExerciseId: null,
        entryExerciseId: "ex-1",
        entrySetNumber: 1,
        entryPerformedReps: 8,
        entryWeightValue: 70,
        entryIsCompleted: true,
      },
      {
        dayName: "Upper 1",
        sessionId: "session-1",
        dayExerciseId: "de-2",
        exerciseId: "ex-1",
        sortOrder: 2,
        exerciseName: "Supino reto maquina",
        prescribedSets: 2,
        repMin: 6,
        repMax: 10,
        imageUrl: "https://example.com/supino.jpg",
        entryDayExerciseId: null,
        entryExerciseId: "ex-1",
        entrySetNumber: 1,
        entryPerformedReps: 8,
        entryWeightValue: 70,
        entryIsCompleted: true,
      },
    ]);

    await expect(getTodayWorkout("user-1", 1)).resolves.toEqual({
      dayName: "Upper 1",
      sessionId: "session-1",
      completedExerciseCount: 0,
      totalExerciseCount: 2,
      exercises: [
        {
          dayExerciseId: "de-1",
          exerciseId: "ex-1",
          sortOrder: 1,
          name: "Supino reto maquina",
          imageUrl: "https://example.com/supino.jpg",
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
            {
              setNumber: 2,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        },
        {
          dayExerciseId: "de-2",
          exerciseId: "ex-1",
          sortOrder: 2,
          name: "Supino reto maquina",
          imageUrl: "https://example.com/supino.jpg",
          previousPerformance: null,
          isExerciseCompleted: false,
          sets: [
            {
              setNumber: 1,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
            {
              setNumber: 2,
              targetRepsMin: 6,
              targetRepsMax: 10,
              performedReps: null,
              weightValue: null,
              isCompleted: false,
            },
          ],
        },
      ],
    });
  });
});
