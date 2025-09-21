import { z } from "zod";
import { router, publicProcedure } from "../trpc/server";
import { invoices, invoiceItems } from "../../database/schema";
import { eq } from "drizzle-orm";

const invoiceItemSchema = z.object({
  productId: z.number().optional(),
  productName: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
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

      return {
        ...invoice[0],
        items,
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
        const taxAmount = (lineSubtotal * item.taxRate) / 100;
        const lineTotal = lineSubtotal + taxAmount;

        subtotal += lineSubtotal;
        totalTax += taxAmount;

        return {
          ...item,
          taxAmount,
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
      const itemsToInsert = processedItems.map((item) => ({
        invoiceId: invoice.id,
        ...item,
      }));

      await ctx.db.insert(invoiceItems).values(itemsToInsert);

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
        const taxAmount = (lineSubtotal * item.taxRate) / 100;
        const lineTotal = lineSubtotal + taxAmount;

        subtotal += lineSubtotal;
        totalTax += taxAmount;

        return {
          ...item,
          taxAmount,
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

      // Delete existing items and create new ones
      await ctx.db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      const itemsToInsert = processedItems.map((item) => ({
        invoiceId: id,
        ...item,
      }));

      await ctx.db.insert(invoiceItems).values(itemsToInsert);

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