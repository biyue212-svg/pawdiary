CREATE TABLE `cloud_spaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`object_key` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `family_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `family_members` (
	`user` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hub_limits` (
	`owner` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `public_pets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`visible` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `public_pets_owner_idx` ON `public_pets` (`owner`);--> statement-breakpoint
CREATE TABLE `social_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`target` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_blocks_unique` ON `social_blocks` (`owner`,`target`);--> statement-breakpoint
CREATE TABLE `social_bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`post_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_bookmarks_unique` ON `social_bookmarks` (`owner`,`post_id`);--> statement-breakpoint
CREATE TABLE `social_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `social_comments_post_idx` ON `social_comments` (`post_id`);--> statement-breakpoint
CREATE TABLE `social_follows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`target` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_follows_unique` ON `social_follows` (`owner`,`target`);--> statement-breakpoint
CREATE TABLE `social_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`receiver` text NOT NULL,
	`data` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `social_invites_receiver_idx` ON `social_invites` (`receiver`);--> statement-breakpoint
CREATE TABLE `social_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`post_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_likes_unique` ON `social_likes` (`owner`,`post_id`);--> statement-breakpoint
CREATE TABLE `social_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`invite_id` text NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `social_messages_invite_idx` ON `social_messages` (`invite_id`);--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`author_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `social_posts_created_idx` ON `social_posts` (`created_at`);--> statement-breakpoint
CREATE TABLE `social_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`post_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL
);
