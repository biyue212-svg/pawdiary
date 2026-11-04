CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`category` text NOT NULL,
	`species` text NOT NULL,
	`message` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_client_created_idx` ON `feedback` (`client_id`,`created_at`);