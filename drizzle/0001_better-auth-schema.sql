PRAGMA foreign_keys=OFF;
--> statement-breakpoint
ALTER TABLE `users` RENAME TO `users__legacy`;
--> statement-breakpoint
CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `emailVerified` integer DEFAULT false NOT NULL,
  `image` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `users` (`id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`)
SELECT
  `id`,
  `name`,
  `email`,
  0,
  null,
  CAST(strftime('%s', `created_at`) AS integer) * 1000,
  CAST(strftime('%s', `updated_at`) AS integer) * 1000
FROM `users__legacy`;
--> statement-breakpoint
DROP TABLE `users__legacy`;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
CREATE TABLE `account` (
  `id` text PRIMARY KEY NOT NULL,
  `accountId` text NOT NULL,
  `providerId` text NOT NULL,
  `userId` text NOT NULL,
  `accessToken` text,
  `refreshToken` text,
  `idToken` text,
  `accessTokenExpiresAt` integer,
  `refreshTokenExpiresAt` integer,
  `scope` text,
  `password` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`userId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_account_unique` ON `account` (`providerId`, `accountId`);
--> statement-breakpoint
CREATE TABLE `session` (
  `id` text PRIMARY KEY NOT NULL,
  `token` text NOT NULL,
  `userId` text NOT NULL,
  `expiresAt` integer NOT NULL,
  `ipAddress` text,
  `userAgent` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`userId`);
--> statement-breakpoint
CREATE TABLE `verification` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expiresAt` integer NOT NULL,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
