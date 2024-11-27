CREATE TABLE `tlg_ebooks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`normalized_title` text NOT NULL,
	`author` text NOT NULL,
	`normalized_author` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `files` ADD `ebook_id` text REFERENCES tlg_ebooks(id);