import { z } from "zod";
import { router, publicProcedure } from "../trpc/server";
import { receipts, receiptItems } from "../../database/schema";
import { eq } from "drizzle-orm";

const receiptItemSchema = z.object({
  productId: z.number().optional(),
  productName: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
});

export const receiptsRouter = router({
  // Get all receipts
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(receipts).orderBy(receipts.createdAt);
  }),

  // Get receipt by ID with line items
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const receipt = await ctx.db
        .select()
        .from(receipts)
        .where(eq(receipts.id, input.id))
        .limit(1);

      if (!receipt[0]) return null;

      const items = await ctx.db
        .select()
        .from(receiptItems)
        .where(eq(receiptItems.receiptId, input.id));

      return {
        ...receipt[0],
        items,
      };
    }),

  // Create new receipt
  create: publicProcedure
    .input(
      z.object({
        receiptNumber: z.string().min(1, "Receipt number is required"),
        issuerName: z.string().min(1, "Issuer name is required"),
        issuerAddress: z.string().optional(),
        issueDate: z.string(),
        paymentMethod: z.enum(["cash", "card", "transfer"]).default("cash"),
        notes: z.string().optional(),
        items: z.array(receiptItemSchema).min(1, "At least one item is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { items, ...receiptData } = input;

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

      // Create receipt
      const receiptResult = await ctx.db
        .insert(receipts)
        .values({
          ...receiptData,
          subtotal,
          totalTax,
          total,
          updatedAt: new Date().toISOString(),
        })
        .returning();

      const receipt = receiptResult[0];

      // Create receipt items
      const itemsToInsert = processedItems.map((item) => ({
        receiptId: receipt.id,
        ...item,
      }));

      await ctx.db.insert(receiptItems).values(itemsToInsert);

      return receipt;
    }),

  // Update receipt
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        receiptNumber: z.string().min(1, "Receipt number is required"),
        issuerName: z.string().min(1, "Issuer name is required"),
        issuerAddress: z.string().optional(),
        issueDate: z.string(),
        paymentMethod: z.enum(["cash", "card", "transfer"]).default("cash"),
        notes: z.string().optional(),
        items: z.array(receiptItemSchema).min(1, "At least one item is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, items, ...receiptData } = input;

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

      // Update receipt
      const receiptResult = await ctx.db
        .update(receipts)
        .set({
          ...receiptData,
          subtotal,
          totalTax,
          total,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(receipts.id, id))
        .returning();

      // Delete existing items and create new ones
      await ctx.db.delete(receiptItems).where(eq(receiptItems.receiptId, id));

      const itemsToInsert = processedItems.map((item) => ({
        receiptId: id,
        ...item,
      }));

      await ctx.db.insert(receiptItems).values(itemsToInsert);

      return receiptResult[0];
    }),

  // Delete receipt
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Items will be deleted automatically due to cascade
      await ctx.db.delete(receipts).where(eq(receipts.id, input.id));
      return { success: true };
    }),

  // Generate next receipt number
  getNextReceiptNumber: publicProcedure.query(async ({ ctx }) => {
    const lastReceipt = await ctx.db
      .select({ receiptNumber: receipts.receiptNumber })
      .from(receipts)
      .orderBy(receipts.id)
      .limit(1);

    if (!lastReceipt.length) {
      return "REC-001";
    }

    // Extract number from last receipt (assuming format REC-XXX)
    const lastNumber = lastReceipt[0].receiptNumber;
    const match = lastNumber.match(/REC-(\d+)/);
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `REC-${nextNumber.toString().padStart(3, "0")}`;
    }

    return "REC-001";
  }),
});