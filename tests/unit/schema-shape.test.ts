import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/sqlite-core";

import {
  users,
  workoutPlans,
  workoutDays,
  exercises,
  dayExercises,
  workoutSessions,
  sessionEntries,
  exerciseImages,
} from "@/lib/db/schema";

describe("schema", () => {
  it("exports the core tables with their required columns", () => {
    expect(getTableConfig(users).name).toBe("users");
    expect(getTableConfig(workoutPlans).name).toBe("workout_plans");
    expect(getTableConfig(workoutDays).name).toBe("workout_days");
    expect(getTableConfig(exercises).name).toBe("exercises");
    expect(getTableConfig(dayExercises).name).toBe("day_exercises");
    expect(getTableConfig(workoutSessions).name).toBe("workout_sessions");
    expect(getTableConfig(sessionEntries).name).toBe("session_entries");
    expect(getTableConfig(exerciseImages).name).toBe("exercise_images");

    expect(
      getTableConfig(dayExercises).columns.map((column) => column.name),
    ).toEqual([
      "id",
      "workout_day_id",
      "exercise_id",
      "sort_order",
      "prescribed_sets",
      "rep_min",
      "rep_max",
      "instruction",
    ]);
  });

  it("defines integrity constraints and indexes for workout queries", () => {
    expect(
      getTableConfig(workoutDays).checks.map((check) => check.name),
    ).toEqual(
      expect.arrayContaining([
        "workout_days_weekday_range_check",
        "workout_days_sort_order_positive_check",
      ]),
    );
    expect(
      getTableConfig(dayExercises).checks.map((check) => check.name),
    ).toEqual(
      expect.arrayContaining([
        "day_exercises_sort_order_positive_check",
        "day_exercises_prescribed_sets_positive_check",
        "day_exercises_rep_range_check",
      ]),
    );
    expect(
      getTableConfig(workoutSessions).checks.map((check) => check.name),
    ).toContain("workout_sessions_status_check");
    expect(
      getTableConfig(sessionEntries).checks.map((check) => check.name),
    ).toEqual(
      expect.arrayContaining([
        "session_entries_set_number_positive_check",
        "session_entries_target_rep_range_check",
      ]),
    );

    expect(
      getTableConfig(workoutPlans).indexes.map((index) => index.config.name),
    ).toContain("workout_plans_user_id_idx");
    expect(
      getTableConfig(workoutDays).indexes.map((index) => index.config.name),
    ).toEqual(
      expect.arrayContaining([
        "workout_days_plan_id_idx",
        "workout_days_plan_sort_idx",
      ]),
    );
    expect(
      getTableConfig(dayExercises).indexes.map((index) => index.config.name),
    ).toEqual(
      expect.arrayContaining([
        "day_exercises_workout_day_id_idx",
        "day_exercises_day_sort_idx",
      ]),
    );
    expect(
      getTableConfig(workoutSessions).indexes.map((index) => index.config.name),
    ).toEqual(
      expect.arrayContaining([
        "workout_sessions_user_id_idx",
        "workout_sessions_user_performed_on_idx",
      ]),
    );
    expect(
      getTableConfig(sessionEntries).indexes.map((index) => index.config.name),
    ).toEqual(
      expect.arrayContaining([
        "session_entries_workout_session_id_idx",
        "session_entries_session_set_idx",
      ]),
    );
    expect(
      getTableConfig(exerciseImages).indexes.map((index) => index.config.name),
    ).toContain("exercise_images_exercise_id_idx");
  });
});
