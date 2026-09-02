CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`email` varchar(320),
	`address` text NOT NULL,
	`city` varchar(120),
	`postalCode` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`customerId` int NOT NULL,
	`service` varchar(160) NOT NULL,
	`itemCount` int,
	`weightKg` varchar(20),
	`instructions` text,
	`status` enum('to_collect','received','washing','ready','in_delivery','delivered') NOT NULL DEFAULT 'to_collect',
	`pickupAt` bigint,
	`deliveryAt` bigint,
	`amountCents` int NOT NULL,
	`paymentMethod` enum('cash','card','transfer','mobile'),
	`paymentStatus` enum('pending','paid') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
