import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

export async function createApp() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext }),
  );

  if (process.env.NODE_ENV === "development") {
    const server = createServer(app);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  return app;
}

if (process.env.NODE_ENV !== "production") {
  createApp().then(app => {
    const port = Number(process.env.PORT || 3000);
    app.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
  }).catch(error => {
    console.error("Failed to start server", error);
    process.exitCode = 1;
  });
}
