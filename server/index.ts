import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { renderPage } from "vike/server";
import { initializeDatabase } from "../database/db";
import { dbHonoMiddleware } from "../lib/database-middleware";
import { trpcHonoMiddleware } from "../lib/trpc-middleware";

const app = new Hono();

// CORS middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Database middleware
app.use("*", dbHonoMiddleware);

// tRPC middleware
app.use("*", trpcHonoMiddleware);

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  app.use('/assets/*', serveStatic({ root: './dist/client/' }));
}

// Vike middleware for all other routes (frontend)
app.all('*', async (c) => {
  const pageContextInit = {
    urlOriginal: c.req.url,
    headersOriginal: c.req.raw.headers,
  };
  
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  
  if (!httpResponse) {
    return c.notFound();
  }

  const { readable, writable } = new TransformStream();
  httpResponse.pipe(writable);

  return new Response(readable, {
    status: httpResponse.statusCode,
    headers: httpResponse.headers,
  });
});

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log("✅ Database initialized successfully");
    
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    console.log(`🚀 Server listening on http://${host}:${port}`);
    
    return serve({
      fetch: app.fetch,
      port: port,
      hostname: host,
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export { app, startServer };