CREATE TABLE `couriers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`vehicle` varchar(120),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `couriers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`kind` enum('pickup','delivery') NOT NULL,
	`routeId` int,
	`courierId` int,
	`scheduledAt` bigint NOT NULL,
	`timeWindow` varchar(80),
	`address` text NOT NULL,
	`status` enum('scheduled','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orderAssignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `orderOperationUnique` UNIQUE(`orderId`,`kind`)
);
--> statement-breakpoint
CREATE TABLE `routeRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routeDate` bigint NOT NULL,
	`kind` enum('pickup','delivery') NOT NULL,
	`zone` varchar(120),
	`status` enum('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`courierId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routeRuns_id` PRIMARY KEY(`id`)
);
