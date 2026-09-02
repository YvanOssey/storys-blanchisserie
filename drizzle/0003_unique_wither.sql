CREATE TABLE `customerAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `customerAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerAccounts_customerId_unique` UNIQUE(`customerId`),
	CONSTRAINT `customerAccounts_email_unique` UNIQUE(`email`)
);
