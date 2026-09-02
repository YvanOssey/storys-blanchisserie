CREATE TABLE `customerNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('to_collect','received','washing','ready','in_delivery','delivered') NOT NULL,
	`title` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerNotifications_id` PRIMARY KEY(`id`)
);
