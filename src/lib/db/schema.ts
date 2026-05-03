import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  authProviderUserId: text("auth_provider_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  ...timestamps,
});

export const workoutPlans = sqliteTable(
  "workout_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    name: text("name").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [index("workout_plans_user_id_idx").on(table.userId)],
);

export const workoutDays = sqliteTable(
  "workout_days",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id").notNull().references(() => workoutPlans.id),
    name: text("name").notNull(),
    weekday: integer("weekday").notNull(),
    sortOrder: integer("sort_order").notNull(),
    ...timestamps,
  },
  (table) => [
    index("workout_days_plan_id_idx").on(table.planId),
    index("workout_days_plan_sort_idx").on(table.planId, table.sortOrder),
    check("workout_days_weekday_range_check", sql`${table.weekday} between 0 and 6`),
    check("workout_days_sort_order_positive_check", sql`${table.sortOrder} > 0`),
  ],
);

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  muscleGroup: text("muscle_group").notNull(),
  movementPattern: text("movement_pattern"),
  notes: text("notes"),
  ...timestamps,
});

export const exerciseImages = sqliteTable(
  "exercise_images",
  {
    id: text("id").primaryKey(),
    exerciseId: text("exercise_id").notNull().references(() => exercises.id),
    imageUrl: text("image_url").notNull(),
    sourceUrl: text("source_url"),
    sourceName: text("source_name"),
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("exercise_images_exercise_id_idx").on(table.exerciseId)],
);

export const dayExercises = sqliteTable(
  "day_exercises",
  {
    id: text("id").primaryKey(),
    workoutDayId: text("workout_day_id")
      .notNull()
      .references(() => workoutDays.id),
    exerciseId: text("exercise_id").notNull().references(() => exercises.id),
    sortOrder: integer("sort_order").notNull(),
    prescribedSets: integer("prescribed_sets").notNull(),
    repMin: integer("rep_min").notNull(),
    repMax: integer("rep_max").notNull(),
    instruction: text("instruction"),
  },
  (table) => [
    index("day_exercises_workout_day_id_idx").on(table.workoutDayId),
    index("day_exercises_day_sort_idx").on(table.workoutDayId, table.sortOrder),
    check("day_exercises_sort_order_positive_check", sql`${table.sortOrder} > 0`),
    check(
      "day_exercises_prescribed_sets_positive_check",
      sql`${table.prescribedSets} > 0`,
    ),
    check("day_exercises_rep_range_check", sql`${table.repMin} > 0 and ${table.repMin} <= ${table.repMax}`),
  ],
);

export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    workoutDayId: text("workout_day_id").references(() => workoutDays.id),
    performedOn: text("performed_on").notNull(),
    sessionNote: text("session_note"),
    status: text("status").notNull().default("in_progress"),
    ...timestamps,
  },
  (table) => [
    index("workout_sessions_user_id_idx").on(table.userId),
    index("workout_sessions_user_performed_on_idx").on(
      table.userId,
      table.performedOn,
    ),
    check(
      "workout_sessions_status_check",
      sql`${table.status} in ('in_progress', 'completed', 'skipped')`,
    ),
  ],
);

export const sessionEntries = sqliteTable(
  "session_entries",
  {
    id: text("id").primaryKey(),
    workoutSessionId: text("workout_session_id")
      .notNull()
      .references(() => workoutSessions.id),
    dayExerciseId: text("day_exercise_id").references(() => dayExercises.id),
    exerciseId: text("exercise_id").notNull().references(() => exercises.id),
    setNumber: integer("set_number").notNull(),
    targetRepsMin: integer("target_reps_min"),
    targetRepsMax: integer("target_reps_max"),
    performedReps: integer("performed_reps"),
    weightValue: integer("weight_value"),
    note: text("note"),
    isCompleted: integer("is_completed", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [
    index("session_entries_workout_session_id_idx").on(table.workoutSessionId),
    index("session_entries_session_set_idx").on(
      table.workoutSessionId,
      table.setNumber,
    ),
    check("session_entries_set_number_positive_check", sql`${table.setNumber} > 0`),
    check(
      "session_entries_target_rep_range_check",
      sql`${table.targetRepsMin} is null or ${table.targetRepsMax} is null or (${table.targetRepsMin} > 0 and ${table.targetRepsMin} <= ${table.targetRepsMax})`,
    ),
  ],
);
