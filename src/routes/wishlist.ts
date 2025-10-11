import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { books, wishlist } from "../db/schema/books";
import { betterAuth } from "../lib/better-auth";
import {
  addToWishlistSchema,
  paginationSchema,
  wishlistBookIdSchema,
} from "../lib/validation";

export const wishlistRoutes = new Elysia({ prefix: "/wishlist" })
  .use(betterAuth)
  .guard({ auth: true })
  .get(
    "/",
    async ({ user, query }) => {
      try {
        const pagination = paginationSchema.parse(query);
        const offset = (pagination.page - 1) * pagination.limit;

        const userWishlist = await db
          .select({
            id: wishlist.id,
            bookId: wishlist.bookId,
            priority: wishlist.priority,
            notes: wishlist.notes,
            createdAt: wishlist.createdAt,
            updatedAt: wishlist.updatedAt,
            book: {
              id: books.id,
              title: books.title,
              authors: books.authors,
              thumbnail: books.thumbnail,
              description: books.description,
              isAvailable: books.isAvailable,
              availableCopies: books.availableCopies,
            },
          })
          .from(wishlist)
          .leftJoin(books, eq(wishlist.bookId, books.id))
          .where(eq(wishlist.userId, user.id))
          .orderBy(desc(wishlist.priority), desc(wishlist.createdAt))
          .limit(pagination.limit)
          .offset(offset);

        const totalCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(wishlist)
          .where(eq(wishlist.userId, user.id));

        return {
          wishlist: userWishlist,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: totalCount[0]?.count || 0,
            totalPages: Math.ceil(
              (totalCount[0]?.count || 0) / pagination.limit,
            ),
          },
        };
      } catch (error) {
        return {
          error: "Failed to fetch wishlist",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/",
    async ({ user, body }) => {
      try {
        const wishlistData = addToWishlistSchema.parse(body);

        // Check if book exists
        const book = await db
          .select()
          .from(books)
          .where(eq(books.id, wishlistData.bookId))
          .limit(1);

        if (book.length === 0) {
          return {
            error: "Book not found",
            message: `Book with ID ${wishlistData.bookId} does not exist`,
          };
        }

        const existingWishlistItem = await db
          .select()
          .from(wishlist)
          .where(
            and(
              eq(wishlist.userId, user.id),
              eq(wishlist.bookId, wishlistData.bookId),
            ),
          )
          .limit(1);

        if (existingWishlistItem.length > 0) {
          return {
            error: "Book already in wishlist",
            message: "This book is already in your wishlist",
          };
        }

        const wishlistId = crypto.randomUUID();

        const newWishlistItem = await db
          .insert(wishlist)
          .values({
            id: wishlistId,
            userId: user.id,
            bookId: wishlistData.bookId,
            priority: wishlistData.priority,
            notes: wishlistData.notes,
          })
          .returning();

        return {
          wishlistItem: newWishlistItem[0],
          message: "Book added to wishlist successfully",
        };
      } catch (error) {
        return {
          error: "Failed to add book to wishlist",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        bookId: t.String(),
        priority: t.Optional(t.Number()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    "/:bookId",
    async ({ user, params }) => {
      try {
        const { bookId } = wishlistBookIdSchema.parse(params);

        const deletedItem = await db
          .delete(wishlist)
          .where(and(eq(wishlist.userId, user.id), eq(wishlist.bookId, bookId)))
          .returning();

        if (deletedItem.length === 0) {
          return {
            error: "Wishlist item not found",
            message: "This book is not in your wishlist",
          };
        }

        return {
          message: "Book removed from wishlist successfully",
        };
      } catch (error) {
        return {
          error: "Failed to remove book from wishlist",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        bookId: t.String(),
      }),
    },
  )
  .patch(
    "/:bookId",
    async ({ user, params, body }) => {
      try {
        const { bookId } = wishlistBookIdSchema.parse(params);
        const updateData = addToWishlistSchema.partial().parse(body);

        const updatedItem = await db
          .update(wishlist)
          .set({
            priority: updateData.priority,
            notes: updateData.notes,
            updatedAt: new Date(),
          })
          .where(and(eq(wishlist.userId, user.id), eq(wishlist.bookId, bookId)))
          .returning();

        if (updatedItem.length === 0) {
          return {
            error: "Wishlist item not found",
            message: "This book is not in your wishlist",
          };
        }

        return {
          wishlistItem: updatedItem[0],
          message: "Wishlist item updated successfully",
        };
      } catch (error) {
        return {
          error: "Failed to update wishlist item",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        bookId: t.String(),
      }),
      body: t.Object({
        priority: t.Optional(t.Number()),
        notes: t.Optional(t.String()),
      }),
    },
  );
