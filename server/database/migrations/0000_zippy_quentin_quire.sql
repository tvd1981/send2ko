CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer,
	`name` text,
	`mime_type` text,
	`size` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tlg_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`id2` text,
	`username` text,
	`full_name` text,
	`language_code` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tlg_users_id2_unique` ON `tlg_users` (`id2`);