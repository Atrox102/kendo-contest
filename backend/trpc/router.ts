import { router } from "./server";
import { productsRouter } from "../products/router";
import { invoicesRouter } from "../invoices/router";
import { receiptsRouter } from "../receipts/router";
import { exportsRouter } from "../exports/router";

export const appRouter = router({
  products: productsRouter,
  invoices: invoicesRouter,
  receipts: receiptsRouter,
  exports: exportsRouter,
});

export type AppRouter = typeof appRouter;