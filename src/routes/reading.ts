import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { books, readingStatus } from "../db/schema/books";
import { betterAuth } from "../lib/better-auth";
import {
  paginationSchema,
  readingStatusBookIdSchema,
  updateReadingStatusSchema,
} from "../lib/validation";

export const readingStatusRoutes = new Elysia({ prefix: "/reading" })
  .use(betterAuth)
  .guard({ auth: true })
  // GET /reading - Get user's reading status for all books
  .get(
    "/",
    async ({ user, query }) => {
      try {
        const pagination = paginationSchema.parse(query);
        const offset = (pagination.page - 1) * pagination.limit;

        const userReadingStatus = await db
          .select({
            id: readingStatus.id,
            bookId: readingStatus.bookId,
            status: readingStatus.status,
            currentPage: readingStatus.currentPage,
            progressPercentage: readingStatus.progressPercentage,
            rating: readingStatus.rating,
            review: readingStatus.review,
            startDate: readingStatus.startDate,
            finishDate: readingStatus.finishDate,
            createdAt: readingStatus.createdAt,
            updatedAt: readingStatus.updatedAt,
            book: {
              id: books.id,
              title: books.title,
              authors: books.authors,
              thumbnail: books.thumbnail,
              pageCount: books.pageCount,
            },
          })
          .from(readingStatus)
          .leftJoin(books, eq(readingStatus.bookId, books.id))
          .where(eq(readingStatus.userId, user.id))
          .orderBy(desc(readingStatus.updatedAt))
          .limit(pagination.limit)
          .offset(offset);

        const totalCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(readingStatus)
          .where(eq(readingStatus.userId, user.id));

        return {
          readingStatus: userReadingStatus,
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
          error: "Failed to fetch reading status",
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

  // GET /reading/:bookId - Get reading status for a specific book
  .get(
    "/:bookId",
    async ({ user, params }) => {
      try {
        const { bookId } = readingStatusBookIdSchema.parse(params);

        const bookReadingStatus = await db
          .select({
            id: readingStatus.id,
            bookId: readingStatus.bookId,
            status: readingStatus.status,
            currentPage: readingStatus.currentPage,
            progressPercentage: readingStatus.progressPercentage,
            rating: readingStatus.rating,
            review: readingStatus.review,
            startDate: readingStatus.startDate,
            finishDate: readingStatus.finishDate,
            createdAt: readingStatus.createdAt,
            updatedAt: readingStatus.updatedAt,
            book: {
              id: books.id,
              title: books.title,
              authors: books.authors,
              thumbnail: books.thumbnail,
              pageCount: books.pageCount,
            },
          })
          .from(readingStatus)
          .leftJoin(books, eq(readingStatus.bookId, books.id))
          .where(
            and(
              eq(readingStatus.userId, user.id),
              eq(readingStatus.bookId, bookId),
            ),
          )
          .limit(1);

        if (bookReadingStatus.length === 0) {
          return {
            error: "Reading status not found",
            message: "No reading status found for this book",
          };
        }

        return bookReadingStatus[0];
      } catch (error) {
        return {
          error: "Failed to fetch reading status",
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

  // PUT /reading/:bookId - Create or update reading status for a book
  .put(
    "/:bookId",
    async ({ user, params, body }) => {
      try {
        const { bookId } = readingStatusBookIdSchema.parse(params);
        const statusData = updateReadingStatusSchema.parse(body);

        // Check if book exists
        const book = await db
          .select()
          .from(books)
          .where(eq(books.id, bookId))
          .limit(1);

        if (book.length === 0) {
          return {
            error: "Book not found",
            message: `Book with ID ${bookId} does not exist`,
          };
        }

        // Check if reading status already exists
        const existingStatus = await db
          .select()
          .from(readingStatus)
          .where(
            and(
              eq(readingStatus.userId, user.id),
              eq(readingStatus.bookId, bookId),
            ),
          )
          .limit(1);

        let result: (typeof readingStatus.$inferSelect)[];
        const now = new Date();

        if (existingStatus.length > 0) {
          // Update existing status
          const updateData: Partial<typeof readingStatus.$inferInsert> = {
            status: statusData.status,
            updatedAt: now,
          };

          // Handle page progress
          if (statusData.currentPage !== undefined) {
            updateData.currentPage = statusData.currentPage;
            if (book[0]?.pageCount && book[0].pageCount > 0) {
              updateData.progressPercentage = Math.round(
                (statusData.currentPage / book[0].pageCount) * 100,
              );
            }
          } else if (statusData.progressPercentage !== undefined) {
            updateData.progressPercentage = statusData.progressPercentage;
            if (book[0]?.pageCount && book[0].pageCount > 0) {
              updateData.currentPage = Math.round(
                (statusData.progressPercentage / 100) * book[0].pageCount,
              );
            }
          }

          // Handle optional fields
          if (statusData.rating !== undefined)
            updateData.rating = statusData.rating;
          if (statusData.review !== undefined)
            updateData.review = statusData.review;
          if (statusData.startDate !== undefined)
            updateData.startDate = new Date(statusData.startDate);
          if (statusData.finishDate !== undefined)
            updateData.finishDate = new Date(statusData.finishDate);

          // Set start date if not set and status is currently_reading
          if (
            statusData.status === "currently_reading" &&
            !existingStatus[0]?.startDate
          ) {
            updateData.startDate = now;
          }

          // Set finish date if status is read and not set
          if (statusData.status === "read" && !existingStatus[0]?.finishDate) {
            updateData.finishDate = now;
          }

          result = await db
            .update(readingStatus)
            .set(updateData)
            .where(eq(readingStatus.id, existingStatus[0]?.id || ""))
            .returning();
        } else {
          // Create new status
          const statusId = crypto.randomUUID();
          const createData: typeof readingStatus.$inferInsert = {
            id: statusId,
            userId: user.id,
            bookId,
            status: statusData.status,
            createdAt: now,
            updatedAt: now,
          };

          // Handle page progress
          if (statusData.currentPage !== undefined) {
            createData.currentPage = statusData.currentPage;
            if (book[0]?.pageCount && book[0].pageCount > 0) {
              createData.progressPercentage = Math.round(
                (statusData.currentPage / book[0].pageCount) * 100,
              );
            }
          } else if (statusData.progressPercentage !== undefined) {
            createData.progressPercentage = statusData.progressPercentage;
            if (book[0]?.pageCount && book[0].pageCount > 0) {
              createData.currentPage = Math.round(
                (statusData.progressPercentage / 100) * book[0].pageCount,
              );
            }
          }

          // Handle optional fields
          if (statusData.rating !== undefined)
            createData.rating = statusData.rating;
          if (statusData.review !== undefined)
            createData.review = statusData.review;
          if (statusData.startDate !== undefined)
            createData.startDate = new Date(statusData.startDate);
          if (statusData.finishDate !== undefined)
            createData.finishDate = new Date(statusData.finishDate);

          // Set start date if status is currently_reading
          if (statusData.status === "currently_reading") {
            createData.startDate = statusData.startDate
              ? new Date(statusData.startDate)
              : now;
          }

          // Set finish date if status is read
          if (statusData.status === "read") {
            createData.finishDate = statusData.finishDate
              ? new Date(statusData.finishDate)
              : now;
          }

          result = await db
            .insert(readingStatus)
            .values(createData)
            .returning();
        }

        return {
          readingStatus: result[0],
          message:
            existingStatus.length > 0
              ? "Reading status updated successfully"
              : "Reading status created successfully",
        };
      } catch (error) {
        return {
          error: "Failed to update reading status",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        bookId: t.String(),
      }),
      body: t.Object({
        status: t.Union([
          t.Literal("want_to_read"),
          t.Literal("currently_reading"),
          t.Literal("read"),
          t.Literal("did_not_finish"),
        ]),
        currentPage: t.Optional(t.Number()),
        progressPercentage: t.Optional(t.Number()),
        rating: t.Optional(t.Number()),
        review: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        finishDate: t.Optional(t.String()),
      }),
    },
  )

  // DELETE /reading/:bookId - Remove reading status for a book
  .delete(
    "/:bookId",
    async ({ user, params }) => {
      try {
        const { bookId } = readingStatusBookIdSchema.parse(params);

        const deletedStatus = await db
          .delete(readingStatus)
          .where(
            and(
              eq(readingStatus.userId, user.id),
              eq(readingStatus.bookId, bookId),
            ),
          )
          .returning();

        if (deletedStatus.length === 0) {
          return {
            error: "Reading status not found",
            message: "No reading status found for this book",
          };
        }

        return {
          message: "Reading status removed successfully",
        };
      } catch (error) {
        return {
          error: "Failed to remove reading status",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        bookId: t.String(),
      }),
    },
  );
