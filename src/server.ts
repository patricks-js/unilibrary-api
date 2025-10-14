import { cors } from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { auth, OpenAPI } from "./lib/auth";
import { booksRoutes } from "./routes/books";
import { loansRoutes } from "./routes/loans";
import { readingStatusRoutes } from "./routes/reading";
import { wishlistRoutes } from "./routes/wishlist";
import z from "zod";

export const app = new Elysia()
  .use(
    cors({
      origin: "https://react-vite-app.lucas-patrick-lsilva.workers.dev",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema
      },
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .mount(auth.handler)
  .use(booksRoutes)
  .use(loansRoutes)
  .use(wishlistRoutes)
  .use(readingStatusRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
