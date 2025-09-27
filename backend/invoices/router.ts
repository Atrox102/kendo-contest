import { z } from "zod";
import { router, publicProcedure } from "../trpc/server";
import { invoices, invoiceItems, invoiceItemTaxes } from "../../database/schema";
import { eq } from "drizzle-orm";

const taxSchema = z.object({
  taxName: z.string().min(1, "Tax name is required"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
  taxAmount: z.number().min(0, "Tax amount must be positive"),
});

const invoiceItemSchema = z.object({
  productId: z.number().optional(),
  productName: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  taxes: z.array(taxSchema).default([]),
  lineTotal: z.number().min(0, "Line total must be positive"),
});

export const invoicesRouter = router({
  // Get all invoices
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(invoices).orderBy(invoices.createdAt);
  }),

  // Get invoice by ID with line items
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.id))
        .limit(1);

      if (!invoice[0]) return null;

      const items = await ctx.db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, input.id));

      // Get taxes for each item
      const itemsWithTaxes = await Promise.all(
        items.map(async (item) => {
          const taxes = await ctx.db
            .select()
            .from(invoiceItemTaxes)
            .where(eq(invoiceItemTaxes.invoiceItemId, item.id));
          
          return {
            ...item,
            taxes,
          };
        })
      );

      return {
        ...invoice[0],
        items: itemsWithTaxes,
      };
    }),

  // Create new invoice
  create: publicProcedure
    .input(
      z.object({
        invoiceNumber: z.string().min(1, "Invoice number is required"),
        issuerName: z.string().min(1, "Issuer name is required"),
        issuerAddress: z.string().optional(),
        issuerTaxId: z.string().optional(),
        clientName: z.string().min(1, "Client name is required"),
        clientAddress: z.string().optional(),
        clientTaxId: z.string().optional(),
        issueDate: z.string(),
        dueDate: z.string().optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { items, ...invoiceData } = input;

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;

      const processedItems = items.map((item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const totalTaxAmount = item.taxes.reduce((sum, tax) => sum + tax.taxAmount, 0);
        const lineTotal = lineSubtotal + totalTaxAmount;

        subtotal += lineSubtotal;
        totalTax += totalTaxAmount;

        return {
          ...item,
          lineTotal,
        };
      });

      const total = subtotal + totalTax;

      // Create invoice
      const invoiceResult = await ctx.db
        .insert(invoices)
        .values({
          ...invoiceData,
          subtotal,
          totalTax,
          total,
          updatedAt: new Date().toISOString(),
        })
        .returning();

      const invoice = invoiceResult[0];

      // Create invoice items
      const itemsToInsert = processedItems.map((item) => {
        const { taxes, ...itemData } = item;
        return {
          invoiceId: invoice.id,
          ...itemData,
        };
      });

      const insertedItems = await ctx.db.insert(invoiceItems).values(itemsToInsert).returning();

      // Create invoice item taxes
      for (let i = 0; i < processedItems.length; i++) {
        const item = processedItems[i];
        const insertedItem = insertedItems[i];
        
        if (item.taxes.length > 0) {
          const taxesToInsert = item.taxes.map((tax) => ({
            invoiceItemId: insertedItem.id,
            taxName: tax.taxName,
            taxRate: tax.taxRate,
            taxAmount: tax.taxAmount,
          }));
          
          await ctx.db.insert(invoiceItemTaxes).values(taxesToInsert);
        }
      }

      return invoice;
    }),

  // Update invoice
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        invoiceNumber: z.string().min(1, "Invoice number is required"),
        issuerName: z.string().min(1, "Issuer name is required"),
        issuerAddress: z.string().optional(),
        issuerTaxId: z.string().optional(),
        clientName: z.string().min(1, "Client name is required"),
        clientAddress: z.string().optional(),
        clientTaxId: z.string().optional(),
        issueDate: z.string(),
        dueDate: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["draft", "sent", "paid", "overdue"]).optional(),
        items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, items, ...invoiceData } = input;

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;

      const processedItems = items.map((item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const totalTaxAmount = item.taxes.reduce((sum, tax) => sum + tax.taxAmount, 0);
        const lineTotal = lineSubtotal + totalTaxAmount;

        subtotal += lineSubtotal;
        totalTax += totalTaxAmount;

        return {
          ...item,
          lineTotal,
        };
      });

      const total = subtotal + totalTax;

      // Update invoice
      const invoiceResult = await ctx.db
        .update(invoices)
        .set({
          ...invoiceData,
          subtotal,
          totalTax,
          total,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(invoices.id, id))
        .returning();

      // Delete existing items and their taxes (cascade will handle taxes)
      await ctx.db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      const itemsToInsert = processedItems.map((item) => {
        const { taxes, ...itemData } = item;
        return {
          invoiceId: id,
          ...itemData,
        };
      });

      const insertedItems = await ctx.db.insert(invoiceItems).values(itemsToInsert).returning();

      // Create invoice item taxes
      for (let i = 0; i < processedItems.length; i++) {
        const item = processedItems[i];
        const insertedItem = insertedItems[i];
        
        if (item.taxes.length > 0) {
          const taxesToInsert = item.taxes.map((tax) => ({
            invoiceItemId: insertedItem.id,
            taxName: tax.taxName,
            taxRate: tax.taxRate,
            taxAmount: tax.taxAmount,
          }));
          
          await ctx.db.insert(invoiceItemTaxes).values(taxesToInsert);
        }
      }

      return invoiceResult[0];
    }),

  // Delete invoice
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Items will be deleted automatically due to cascade
      await ctx.db.delete(invoices).where(eq(invoices.id, input.id));
      return { success: true };
    }),

  // Generate next invoice number
  getNextInvoiceNumber: publicProcedure.query(async ({ ctx }) => {
    const lastInvoice = await ctx.db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .orderBy(invoices.id)
      .limit(1);

    if (!lastInvoice.length) {
      return "INV-001";
    }

    // Extract number from last invoice (assuming format INV-XXX)
    const lastNumber = lastInvoice[0].invoiceNumber;
    const match = lastNumber.match(/INV-(\d+)/);
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `INV-${nextNumber.toString().padStart(3, "0")}`;
    }

    return "INV-001";
  }),
});