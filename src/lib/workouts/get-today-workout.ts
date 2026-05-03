import { and, asc, eq, isNull, or } from "drizzle-orm";

import {
  dayExercises,
  exerciseImages,
  exercises,
  sessionEntries,
  workoutDays,
  workoutPlans,
  workoutSessions,
} from "@/lib/db/schema";

export type TodayWorkoutExerciseInput = {
  dayExerciseId: string;
  exerciseId: string;
  sortOrder: number;
  name: string;
  prescribedSets: number;
  repMin: number;
  repMax: number;
  imageUrl: string | null;
  previousPerformance: TodayWorkoutPreviousPerformance | null;
  loggedSets: TodayWorkoutLoggedSet[];
};

export type TodayWorkoutInput = {
  dayName: string;
  sessionId: string | null;
  exercises: TodayWorkoutExerciseInput[];
};

export type TodayWorkoutLoggedSet = {
  setNumber: number;
  performedReps: number | null;
  weightValue: number | null;
  isCompleted: boolean;
};

export type TodayWorkoutSet = {
  setNumber: number;
  targetRepsMin: number;
  targetRepsMax: number;
  performedReps: number | null;
  weightValue: number | null;
  isCompleted: boolean;
};

export type TodayWorkoutPreviousPerformance = {
  performedReps: number;
  weightValue: number;
};

export type TodayWorkoutExercise = {
  dayExerciseId: string;
  exerciseId: string;
  sortOrder: number;
  name: string;
  imageUrl: string | null;
  previousPerformance: TodayWorkoutPreviousPerformance | null;
  isExerciseCompleted: boolean;
  sets: TodayWorkoutSet[];
};

export type TodayWorkoutViewModel = {
  dayName: string;
  sessionId: string | null;
  completedExerciseCount: number;
  totalExerciseCount: number;
  exercises: TodayWorkoutExercise[];
};

export function buildTodayWorkoutViewModel(
  input: TodayWorkoutInput,
): TodayWorkoutViewModel {
  const exercises = [...input.exercises]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((exercise) => {
      const hasOutOfRangeLoggedSet = exercise.loggedSets.some(
        (loggedSet) =>
          loggedSet.setNumber < 1 ||
          loggedSet.setNumber > exercise.prescribedSets,
      );

      if (hasOutOfRangeLoggedSet) {
        throw new Error(
          `Logged set number exceeds prescribed sets for day exercise ${exercise.dayExerciseId}`,
        );
      }

      const uniqueLoggedSetNumbers = new Set(
        exercise.loggedSets.map((loggedSet) => loggedSet.setNumber),
      );

      if (uniqueLoggedSetNumbers.size !== exercise.loggedSets.length) {
        throw new Error(
          `Logged sets contain duplicate set number for day exercise ${exercise.dayExerciseId}`,
        );
      }

      const loggedSetsByNumber = new Map(
        exercise.loggedSets.map((loggedSet) => [
          loggedSet.setNumber,
          loggedSet,
        ]),
      );

      const sets = Array.from(
        { length: exercise.prescribedSets },
        (_, index) => {
          const setNumber = index + 1;
          const loggedSet = loggedSetsByNumber.get(setNumber);

          return {
            setNumber,
            targetRepsMin: exercise.repMin,
            targetRepsMax: exercise.repMax,
            performedReps: loggedSet?.performedReps ?? null,
            weightValue: loggedSet?.weightValue ?? null,
            isCompleted: loggedSet?.isCompleted ?? false,
          };
        },
      );

      return {
        dayExerciseId: exercise.dayExerciseId,
        exerciseId: exercise.exerciseId,
        sortOrder: exercise.sortOrder,
        name: exercise.name,
        imageUrl: exercise.imageUrl,
        previousPerformance: exercise.previousPerformance,
        isExerciseCompleted:
          sets.length > 0 && sets.every((set) => set.isCompleted),
        sets,
      };
    });

  return {
    dayName: input.dayName,
    sessionId: input.sessionId,
    completedExerciseCount: exercises.filter(
      (exercise) => exercise.isExerciseCompleted,
    ).length,
    totalExerciseCount: exercises.length,
    exercises,
  };
}

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayWorkoutContext(referenceDate = new Date()) {
  return {
    weekday: referenceDate.getDay(),
    dateString: formatDateString(referenceDate),
  };
}

export async function getTodayWorkout(
  userId: string,
  weekday: number,
): Promise<TodayWorkoutViewModel | null> {
  const { db } = await import("@/lib/db");
  const today = getTodayWorkoutContext();

  const rows = await db
    .select({
      dayName: workoutDays.name,
      sessionId: workoutSessions.id,
      dayExerciseId: dayExercises.id,
      exerciseId: exercises.id,
      sortOrder: dayExercises.sortOrder,
      exerciseName: exercises.name,
      prescribedSets: dayExercises.prescribedSets,
      repMin: dayExercises.repMin,
      repMax: dayExercises.repMax,
      imageUrl: exerciseImages.imageUrl,
      entryDayExerciseId: sessionEntries.dayExerciseId,
      entryExerciseId: sessionEntries.exerciseId,
      entrySetNumber: sessionEntries.setNumber,
      entryPerformedReps: sessionEntries.performedReps,
      entryWeightValue: sessionEntries.weightValue,
      entryIsCompleted: sessionEntries.isCompleted,
    })
    .from(workoutPlans)
    .innerJoin(
      workoutDays,
      and(
        eq(workoutDays.planId, workoutPlans.id),
        eq(workoutDays.weekday, weekday),
      ),
    )
    .innerJoin(dayExercises, eq(dayExercises.workoutDayId, workoutDays.id))
    .innerJoin(exercises, eq(exercises.id, dayExercises.exerciseId))
    .leftJoin(
      exerciseImages,
      and(
        eq(exerciseImages.exerciseId, exercises.id),
        eq(exerciseImages.isPrimary, true),
      ),
    )
    .leftJoin(
      workoutSessions,
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.workoutDayId, workoutDays.id),
        eq(workoutSessions.performedOn, today.dateString),
      ),
    )
    .leftJoin(
      sessionEntries,
      and(
        eq(sessionEntries.workoutSessionId, workoutSessions.id),
        or(
          eq(sessionEntries.dayExerciseId, dayExercises.id),
          and(
            isNull(sessionEntries.dayExerciseId),
            eq(sessionEntries.exerciseId, exercises.id),
          ),
        ),
      ),
    )
    .where(
      and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true)),
    )
    .orderBy(asc(dayExercises.sortOrder), asc(sessionEntries.setNumber));

  if (rows.length === 0) {
    return null;
  }

  const dayExerciseIdsByExerciseId = new Map<string, Set<string>>();

  for (const row of rows) {
    const dayExerciseIds =
      dayExerciseIdsByExerciseId.get(row.exerciseId) ?? new Set<string>();

    dayExerciseIds.add(row.dayExerciseId);
    dayExerciseIdsByExerciseId.set(row.exerciseId, dayExerciseIds);
  }

  const exercisesByDayExerciseId = new Map<string, TodayWorkoutExerciseInput>();

  for (const row of rows) {
    let exercise = exercisesByDayExerciseId.get(row.dayExerciseId);

    if (!exercise) {
      exercise = {
        dayExerciseId: row.dayExerciseId,
        exerciseId: row.exerciseId,
        sortOrder: row.sortOrder,
        name: row.exerciseName,
        prescribedSets: row.prescribedSets,
        repMin: row.repMin,
        repMax: row.repMax,
        imageUrl: row.imageUrl,
        previousPerformance: null,
        loggedSets: [],
      };

      exercisesByDayExerciseId.set(row.dayExerciseId, exercise);
    }

    const hasDuplicateExerciseSlots =
      (dayExerciseIdsByExerciseId.get(row.exerciseId)?.size ?? 0) > 1;
    const entryMatchesCurrentExercise =
      row.entryDayExerciseId === row.dayExerciseId ||
      (row.entryDayExerciseId === null &&
        row.entryExerciseId === row.exerciseId &&
        !hasDuplicateExerciseSlots);

    if (row.entrySetNumber !== null && entryMatchesCurrentExercise) {
      exercise.loggedSets.push({
        setNumber: row.entrySetNumber,
        performedReps: row.entryPerformedReps,
        weightValue: row.entryWeightValue,
        isCompleted: row.entryIsCompleted ?? false,
      });
    }
  }

  return buildTodayWorkoutViewModel({
    dayName: rows[0].dayName,
    sessionId: rows[0].sessionId,
    exercises: [...exercisesByDayExerciseId.values()],
  });
}
