CREATE TABLE `day_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_day_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`prescribed_sets` integer NOT NULL,
	`rep_min` integer NOT NULL,
	`rep_max` integer NOT NULL,
	`instruction` text,
	FOREIGN KEY (`workout_day_id`) REFERENCES `workout_days`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "day_exercises_sort_order_positive_check" CHECK("day_exercises"."sort_order" > 0),
	CONSTRAINT "day_exercises_prescribed_sets_positive_check" CHECK("day_exercises"."prescribed_sets" > 0),
	CONSTRAINT "day_exercises_rep_range_check" CHECK("day_exercises"."rep_min" > 0 and "day_exercises"."rep_min" <= "day_exercises"."rep_max")
);
--> statement-breakpoint
CREATE INDEX `day_exercises_workout_day_id_idx` ON `day_exercises` (`workout_day_id`);--> statement-breakpoint
CREATE INDEX `day_exercises_day_sort_idx` ON `day_exercises` (`workout_day_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `exercise_images` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`image_url` text NOT NULL,
	`source_url` text,
	`source_name` text,
	`is_primary` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `exercise_images_exercise_id_idx` ON `exercise_images` (`exercise_id`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`muscle_group` text NOT NULL,
	`movement_pattern` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_slug_unique` ON `exercises` (`slug`);--> statement-breakpoint
CREATE TABLE `session_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_session_id` text NOT NULL,
	`day_exercise_id` text,
	`exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`target_reps_min` integer,
	`target_reps_max` integer,
	`performed_reps` integer,
	`weight_value` integer,
	`note` text,
	`is_completed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`workout_session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`day_exercise_id`) REFERENCES `day_exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "session_entries_set_number_positive_check" CHECK("session_entries"."set_number" > 0),
	CONSTRAINT "session_entries_target_rep_range_check" CHECK("session_entries"."target_reps_min" is null or "session_entries"."target_reps_max" is null or ("session_entries"."target_reps_min" > 0 and "session_entries"."target_reps_min" <= "session_entries"."target_reps_max"))
);
--> statement-breakpoint
CREATE INDEX `session_entries_workout_session_id_idx` ON `session_entries` (`workout_session_id`);--> statement-breakpoint
CREATE INDEX `session_entries_session_set_idx` ON `session_entries` (`workout_session_id`,`set_number`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_provider_user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_auth_provider_user_id_unique` ON `users` (`auth_provider_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `workout_days` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`name` text NOT NULL,
	`weekday` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `workout_plans`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "workout_days_weekday_range_check" CHECK("workout_days"."weekday" between 0 and 6),
	CONSTRAINT "workout_days_sort_order_positive_check" CHECK("workout_days"."sort_order" > 0)
);
--> statement-breakpoint
CREATE INDEX `workout_days_plan_id_idx` ON `workout_days` (`plan_id`);--> statement-breakpoint
CREATE INDEX `workout_days_plan_sort_idx` ON `workout_days` (`plan_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `workout_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `workout_plans_user_id_idx` ON `workout_plans` (`user_id`);--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workout_day_id` text,
	`performed_on` text NOT NULL,
	`session_note` text,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_day_id`) REFERENCES `workout_days`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "workout_sessions_status_check" CHECK("workout_sessions"."status" in ('in_progress', 'completed', 'skipped'))
);
--> statement-breakpoint
CREATE INDEX `workout_sessions_user_id_idx` ON `workout_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `workout_sessions_user_performed_on_idx` ON `workout_sessions` (`user_id`,`performed_on`);