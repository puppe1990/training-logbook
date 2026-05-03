import { describe, expect, it } from "vitest";
import { buildTodayWorkoutViewModel } from "@/lib/workouts/get-today-workout";

describe("buildTodayWorkoutViewModel", () => {
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
});
