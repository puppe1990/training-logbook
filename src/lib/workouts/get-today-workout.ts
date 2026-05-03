export type TodayWorkoutExerciseInput = {
  sortOrder: number;
  name: string;
};

export type TodayWorkoutInput = {
  dayName: string;
  exercises: TodayWorkoutExerciseInput[];
};

export type TodayWorkoutExercise = TodayWorkoutExerciseInput;

export type TodayWorkoutViewModel = {
  dayName: string;
  exercises: TodayWorkoutExercise[];
};

export function buildTodayWorkoutViewModel(
  input: TodayWorkoutInput,
): TodayWorkoutViewModel {
  return {
    dayName: input.dayName,
    exercises: [...input.exercises].sort((a, b) => a.sortOrder - b.sortOrder),
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
