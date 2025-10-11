import { cors } from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { auth, OpenAPI } from "./lib/auth";
import { booksRoutes } from "./routes/books";
import { loansRoutes } from "./routes/loans";
import { readingStatusRoutes } from "./routes/reading";
import { wishlistRoutes } from "./routes/wishlist";

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(
    openapi({
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
