CREATE TABLE `adminWhitelist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`addedByOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminWhitelist_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminWhitelist_email_unique` UNIQUE(`email`)
);
