CREATE TABLE `adminNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int,
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminNotifications_id` PRIMARY KEY(`id`)
);
