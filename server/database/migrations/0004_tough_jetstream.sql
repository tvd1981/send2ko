PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_files` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer,
	`ebook_id` text,
	`name` text,
	`mime_type` text,
	`size` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_files`("id", "user_id", "ebook_id", "name", "mime_type", "size", "created_at") SELECT "id", "user_id", "ebook_id", "name", "mime_type", "size", "created_at" FROM `files`;--> statement-breakpoint
DROP TABLE `files`;--> statement-breakpoint
ALTER TABLE `__new_files` RENAME TO `files`;--> statement-breakpoint
PRAGMA foreign_keys=ON;