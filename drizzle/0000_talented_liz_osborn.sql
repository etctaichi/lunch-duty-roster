CREATE TABLE `allowed_users` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`password` text
);
