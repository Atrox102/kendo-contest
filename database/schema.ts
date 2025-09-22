import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Products table - stores user's catalog of products/services
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  defaultPrice: real('default_price').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Product taxes table - supports multiple taxes per product
export const productTaxes = sqliteTable('product_taxes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  taxName: text('tax_name').notNull(), // VAT, Sales Tax, Service Tax, etc.
  taxRate: real('tax_rate').notNull(), // Tax rate as percentage (e.g., 20 for 20%)
  isDefault: integer('is_default', { mode: 'boolean' }).default(false), // Whether this is the default tax for the product
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Invoices table - B2B invoices
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  
  // Issuer details (user's business)
  issuerName: text('issuer_name').notNull(),
  issuerAddress: text('issuer_address'),
  issuerTaxId: text('issuer_tax_id'),
  
  // Client details
  clientName: text('client_name').notNull(),
  clientAddress: text('client_address'),
  clientTaxId: text('client_tax_id'),
  
  // Invoice details
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date'),
  subtotal: real('subtotal').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  total: real('total').notNull().default(0),
  notes: text('notes'),
  status: text('status').notNull().default('draft'), // draft, sent, paid, overdue
  
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Invoice line items
export const invoiceItems = sqliteTable('invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(), // Stored separately in case product is deleted
  description: text('description'),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  lineTotal: real('line_total').notNull().default(0), // quantity * unitPrice + total tax amount
});

// Invoice item taxes - supports multiple taxes per line item
export const invoiceItemTaxes = sqliteTable('invoice_item_taxes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceItemId: integer('invoice_item_id').notNull().references(() => invoiceItems.id, { onDelete: 'cascade' }),
  taxName: text('tax_name').notNull(),
  taxRate: real('tax_rate').notNull(),
  taxAmount: real('tax_amount').notNull(),
});

// Receipts table - B2C receipts (simpler than invoices)
export const receipts = sqliteTable('receipts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  receiptNumber: text('receipt_number').notNull().unique(),
  
  // Issuer details (user's business)
  issuerName: text('issuer_name').notNull(),
  issuerAddress: text('issuer_address'),
  
  // Receipt details
  issueDate: text('issue_date').notNull(),
  subtotal: real('subtotal').notNull().default(0),
  totalTax: real('total_tax').notNull().default(0),
  total: real('total').notNull().default(0),
  paymentMethod: text('payment_method').default('cash'), // cash, card, transfer
  notes: text('notes'),
  
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Receipt line items
export const receiptItems = sqliteTable('receipt_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  receiptId: integer('receipt_id').notNull().references(() => receipts.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  description: text('description'),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  lineTotal: real('line_total').notNull().default(0), // quantity * unitPrice + total tax amount
});

// Receipt item taxes - supports multiple taxes per line item
export const receiptItemTaxes = sqliteTable('receipt_item_taxes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  receiptItemId: integer('receipt_item_id').notNull().references(() => receiptItems.id, { onDelete: 'cascade' }),
  taxName: text('tax_name').notNull(),
  taxRate: real('tax_rate').notNull(),
  taxAmount: real('tax_amount').notNull(),
});

// Types for TypeScript
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductTax = typeof productTaxes.$inferSelect;
export type NewProductTax = typeof productTaxes.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type InvoiceItemTax = typeof invoiceItemTaxes.$inferSelect;
export type NewInvoiceItemTax = typeof invoiceItemTaxes.$inferInsert;

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;

export type ReceiptItem = typeof receiptItems.$inferSelect;
export type NewReceiptItem = typeof receiptItems.$inferInsert;

export type ReceiptItemTax = typeof receiptItemTaxes.$inferSelect;
export type NewReceiptItemTax = typeof receiptItemTaxes.$inferInsert;