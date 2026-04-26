PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_rate_limits` (
	`ip` text NOT NULL,
	`window_start` text NOT NULL,
	`scope` text NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`ip`, `window_start`, `scope`),
	CONSTRAINT "rate_limits_scope_check" CHECK("__new_rate_limits"."scope" IN ('pick','comment','auth'))
);
--> statement-breakpoint
INSERT INTO `__new_rate_limits`("ip", "window_start", "scope", "count") SELECT "ip", "window_start", "scope", "count" FROM `rate_limits`;--> statement-breakpoint
DROP TABLE `rate_limits`;--> statement-breakpoint
ALTER TABLE `__new_rate_limits` RENAME TO `rate_limits`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_rate_limits_window` ON `rate_limits` (`window_start`);