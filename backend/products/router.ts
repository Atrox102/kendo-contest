import { z } from "zod";
import { router, publicProcedure } from "../trpc/server";
import { products, productTaxes } from "../../database/schema";
import { eq } from "drizzle-orm";

export const productsRouter = router({
  // Get all products with their taxes
  list: publicProcedure.query(async ({ ctx }) => {
    const productsData = await ctx.db.select().from(products).orderBy(products.name);
    
    // Get taxes for all products
    const productIds = productsData.map(p => p.id);
    const taxes = productIds.length > 0 
      ? await ctx.db.select().from(productTaxes).where(eq(productTaxes.productId, productIds[0])) // This will be improved with proper join
      : [];
    
    // For now, let's get taxes for each product individually
    const productsWithTaxes = await Promise.all(
      productsData.map(async (product) => {
        const productTaxList = await ctx.db
          .select()
          .from(productTaxes)
          .where(eq(productTaxes.productId, product.id));
        return {
          ...product,
          taxes: productTaxList
        };
      })
    );
    
    return productsWithTaxes;
  }),

  // Get product by ID with taxes
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);
      
      if (!result[0]) return null;
      
      const taxes = await ctx.db
        .select()
        .from(productTaxes)
        .where(eq(productTaxes.productId, input.id));
      
      return {
        ...result[0],
        taxes
      };
    }),

  // Create new product with taxes
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        defaultPrice: z.number().min(0, "Price must be positive"),
        taxes: z.array(z.object({
          taxName: z.string().min(1, "Tax name is required"),
          taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
          isDefault: z.boolean().default(false)
        })).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { taxes, ...productData } = input;
      
      // Create the product
      const productResult = await ctx.db
        .insert(products)
        .values({
          ...productData,
          updatedAt: new Date().toISOString(),
        })
        .returning();
      
      const product = productResult[0];
      
      // Create the taxes
      if (taxes.length > 0) {
        await ctx.db.insert(productTaxes).values(
          taxes.map(tax => ({
            productId: product.id,
            ...tax
          }))
        );
      }
      
      // Return product with taxes
      const productTaxList = await ctx.db
        .select()
        .from(productTaxes)
        .where(eq(productTaxes.productId, product.id));
      
      return {
        ...product,
        taxes: productTaxList
      };
    }),

  // Update product with taxes
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        defaultPrice: z.number().min(0, "Price must be positive"),
        taxes: z.array(z.object({
          taxName: z.string().min(1, "Tax name is required"),
          taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
          isDefault: z.boolean().default(false)
        })).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, taxes, ...updateData } = input;
      
      // Update the product
      const productResult = await ctx.db
        .update(products)
        .set({
          ...updateData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, id))
        .returning();
      
      const product = productResult[0];
      
      // Delete existing taxes
      await ctx.db.delete(productTaxes).where(eq(productTaxes.productId, id));
      
      // Create new taxes
      if (taxes.length > 0) {
        await ctx.db.insert(productTaxes).values(
          taxes.map(tax => ({
            productId: id,
            ...tax
          }))
        );
      }
      
      // Return product with taxes
      const productTaxList = await ctx.db
        .select()
        .from(productTaxes)
        .where(eq(productTaxes.productId, id));
      
      return {
        ...product,
        taxes: productTaxList
      };
    }),

  // Delete product
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),
});