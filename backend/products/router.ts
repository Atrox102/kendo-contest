import { z } from "zod";
import { router, publicProcedure } from "../trpc/server";
import { products } from "../../database/schema";
import { eq } from "drizzle-orm";

export const productsRouter = router({
  // Get all products
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(products).orderBy(products.name);
  }),

  // Get product by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);
      return result[0] || null;
    }),

  // Create new product
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        defaultPrice: z.number().min(0, "Price must be positive"),
        taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
        taxName: z.string().default("VAT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(products)
        .values({
          ...input,
          updatedAt: new Date().toISOString(),
        })
        .returning();
      return result[0];
    }),

  // Update product
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        defaultPrice: z.number().min(0, "Price must be positive"),
        taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
        taxName: z.string().default("VAT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const result = await ctx.db
        .update(products)
        .set({
          ...updateData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, id))
        .returning();
      return result[0];
    }),

  // Delete product
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),
});