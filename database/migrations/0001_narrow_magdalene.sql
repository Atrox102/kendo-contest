CREATE TABLE `product_taxes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`tax_name` text NOT NULL,
	`tax_rate` real NOT NULL,
	`is_default` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `invoices` DROP COLUMN `issuer_email`;--> statement-breakpoint
ALTER TABLE `invoices` DROP COLUMN `issuer_phone`;--> statement-breakpoint
ALTER TABLE `invoices` DROP COLUMN `client_email`;--> statement-breakpoint
ALTER TABLE `invoices` DROP COLUMN `client_phone`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `tax_rate`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `tax_name`;--> statement-breakpoint
ALTER TABLE `receipts` DROP COLUMN `issuer_email`;--> statement-breakpoint
ALTER TABLE `receipts` DROP COLUMN `issuer_phone`;