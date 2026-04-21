CREATE TABLE `canvas_config` (
	`id` integer PRIMARY KEY NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	CONSTRAINT "canvas_config_singleton" CHECK("canvas_config"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_station_id` integer NOT NULL,
	`to_station_id` integer NOT NULL,
	`line_code` text NOT NULL,
	`path_json` text NOT NULL,
	FOREIGN KEY (`from_station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_code`) REFERENCES `lines`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lines` (
	`code` text PRIMARY KEY NOT NULL,
	`name_zh` text,
	`name_en` text,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `station_lines` (
	`station_id` integer NOT NULL,
	`line_code` text NOT NULL,
	PRIMARY KEY(`station_id`, `line_code`),
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_code`) REFERENCES `lines`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stations` (
	`id` integer PRIMARY KEY NOT NULL,
	`name_zh` text NOT NULL,
	`name_en` text,
	`lat` real,
	`lng` real,
	`schematic_x` real NOT NULL,
	`schematic_y` real NOT NULL,
	`label_x` real NOT NULL,
	`label_y` real NOT NULL,
	`label_anchor` text NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "stations_label_anchor_check" CHECK("stations"."label_anchor" IN ('start','middle','end'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stations_name_zh_unique` ON `stations` (`name_zh`);