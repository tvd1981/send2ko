PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tlg_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`id2` text,
	`username` text,
	`full_name` text,
	`language_code` text,
	`settings` text DEFAULT '{"web": 20, "opds": 20}',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tlg_users`("id", "id2", "username", "full_name", "language_code", "settings", "created_at", "updated_at") SELECT "id", "id2", "username", "full_name", "language_code", "settings", "created_at", "updated_at" FROM `tlg_users`;--> statement-breakpoint
DROP TABLE `tlg_users`;--> statement-breakpoint
ALTER TABLE `__new_tlg_users` RENAME TO `tlg_users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `tlg_users_id2_unique` ON `tlg_users` (`id2`);