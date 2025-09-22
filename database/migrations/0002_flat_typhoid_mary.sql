CREATE TABLE `invoice_item_taxes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_item_id` integer NOT NULL,
	`tax_name` text NOT NULL,
	`tax_rate` real NOT NULL,
	`tax_amount` real NOT NULL,
	FOREIGN KEY (`invoice_item_id`) REFERENCES `invoice_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `receipt_item_taxes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`receipt_item_id` integer NOT NULL,
	`tax_name` text NOT NULL,
	`tax_rate` real NOT NULL,
	`tax_amount` real NOT NULL,
	FOREIGN KEY (`receipt_item_id`) REFERENCES `receipt_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `invoice_items` DROP COLUMN `tax_rate`;--> statement-breakpoint
ALTER TABLE `invoice_items` DROP COLUMN `tax_amount`;--> statement-breakpoint
ALTER TABLE `receipt_items` DROP COLUMN `tax_rate`;--> statement-breakpoint
ALTER TABLE `receipt_items` DROP COLUMN `tax_amount`;