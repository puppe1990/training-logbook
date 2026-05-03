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
  sessionId: string;
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
  sessionId: string;
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

export async function getTodayWorkout(
  userId: string,
  weekday: number,
): Promise<TodayWorkoutViewModel | null> {
  void userId;
  void weekday;

  // Query the active plan, matching workout day, day exercises, exercise images,
  // and latest session entries here once the surrounding data plumbing is ready.
  return null;
}
