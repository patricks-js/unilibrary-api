import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { books, loans } from "../db/schema/books";
import { betterAuth } from "../lib/better-auth";
import {
  createLoanSchema,
  loanHistoryFiltersSchema,
  loanIdSchema,
  returnLoanSchema,
} from "../lib/validation";

export const loansRoutes = new Elysia({ prefix: "/loans" })
  .use(betterAuth)
  .guard({ auth: true })
  .get(
    "/",
    async ({ user, query }) => {
      try {
        const filters = loanHistoryFiltersSchema.parse({
          page: query.page || 1,
          limit: query.limit || 20,
          status: query.status,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        });
        const offset = (filters.page - 1) * filters.limit;

        const conditions = [eq(loans.userId, user.id)];

        if (filters.status) {
          conditions.push(eq(loans.status, filters.status));
        }

        if (filters.startDate) {
          conditions.push(sql`${loans.loanDate} >= ${filters.startDate}`);
        }

        if (filters.endDate) {
          conditions.push(sql`${loans.loanDate} <= ${filters.endDate}`);
        }

        const whereConditions = and(...conditions);

        const userLoans = await db
          .select({
            id: loans.id,
            bookId: loans.bookId,
            loanDate: loans.loanDate,
            dueDate: loans.dueDate,
            returnDate: loans.returnDate,
            status: loans.status,
            renewalCount: loans.renewalCount,
            notes: loans.notes,
            createdAt: loans.createdAt,
            updatedAt: loans.updatedAt,
            book: {
              id: books.id,
              title: books.title,
              authors: books.authors,
              thumbnail: books.thumbnail,
            },
          })
          .from(loans)
          .leftJoin(books, eq(loans.bookId, books.id))
          .where(whereConditions)
          .orderBy(desc(loans.createdAt))
          .limit(filters.limit)
          .offset(offset);

        const totalCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(loans)
          .where(whereConditions);

        return {
          loans: userLoans,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: totalCount[0]?.count || 0,
            totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
          },
        };
      } catch (error) {
        return {
          error: "Failed to fetch loans",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal("active"),
            t.Literal("returned"),
            t.Literal("overdue"),
          ]),
        ),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/",
    async ({ user, body }) => {
      try {
        const loanData = createLoanSchema.parse(body);

        const book = await db
          .select()
          .from(books)
          .where(eq(books.id, loanData.bookId))
          .limit(1);

        if (book.length === 0) {
          return {
            error: "Book not found",
            message: `Book with ID ${loanData.bookId} does not exist`,
          };
        }

        const bookData = book[0];
        if (!bookData) {
          return {
            error: "Book not found",
            message: `Book with ID ${loanData.bookId} does not exist`,
          };
        }

        if (!bookData.isAvailable || bookData.availableCopies <= 0) {
          return {
            error: "Book not available",
            message: "This book is currently not available for loan",
          };
        }

        const existingLoan = await db
          .select()
          .from(loans)
          .where(
            and(
              eq(loans.userId, user.id),
              eq(loans.bookId, loanData.bookId),
              eq(loans.status, "active"),
            ),
          )
          .limit(1);

        if (existingLoan.length > 0) {
          return {
            error: "Loan already exists",
            message: "You already have an active loan for this book",
          };
        }

        const dueDate = loanData.dueDate
          ? new Date(loanData.dueDate)
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        const loanId = crypto.randomUUID();

        const newLoan = await db
          .insert(loans)
          .values({
            id: loanId,
            userId: user.id,
            bookId: loanData.bookId,
            loanDate: new Date(),
            dueDate,
            status: "active",
            renewalCount: 0,
          })
          .returning();

        await db
          .update(books)
          .set({
            availableCopies: sql`${books.availableCopies} - 1`,
            isAvailable: sql`${books.availableCopies} - 1 > 0`,
          })
          .where(eq(books.id, loanData.bookId));

        return {
          loan: newLoan[0],
          message: "Loan created successfully",
        };
      } catch (error) {
        return {
          error: "Failed to create loan",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: createLoanSchema,
    },
  )
  .patch(
    "/:loanId/return",
    async ({ user, params, body }) => {
      try {
        const { loanId } = loanIdSchema.parse(params);
        const returnData = returnLoanSchema.parse(body);

        const loan = await db
          .select()
          .from(loans)
          .where(
            and(
              eq(loans.id, loanId),
              eq(loans.userId, user.id),
              eq(loans.status, "active"),
            ),
          )
          .limit(1);

        if (loan.length === 0) {
          return {
            error: "Loan not found",
            message:
              "Active loan not found or you don't have permission to return it",
          };
        }

        const updatedLoan = await db
          .update(loans)
          .set({
            returnDate: new Date(),
            status: "returned",
            notes: returnData.notes,
            updatedAt: new Date(),
          })
          .where(eq(loans.id, loanId))
          .returning();

        await db
          .update(books)
          .set({
            availableCopies: sql`${books.availableCopies} + 1`,
            isAvailable: sql`${books.availableCopies} + 1 > 0`,
          })
          .where(eq(books.id, loan[0]?.bookId || ""));

        return {
          loan: updatedLoan[0],
          message: "Book returned successfully",
        };
      } catch (error) {
        return {
          error: "Failed to return book",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        loanId: t.String(),
      }),
      body: t.Object({
        notes: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/history",
    async ({ user, query }) => {
      try {
        const filters = loanHistoryFiltersSchema.parse({
          page: query.page || 1,
          limit: query.limit || 20,
          status: query.status,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        });
        const offset = (filters.page - 1) * filters.limit;

        const conditions = [eq(loans.userId, user.id)];

        if (filters.status) {
          conditions.push(eq(loans.status, filters.status));
        }

        if (filters.startDate) {
          conditions.push(sql`${loans.loanDate} >= ${filters.startDate}`);
        }

        if (filters.endDate) {
          conditions.push(sql`${loans.loanDate} <= ${filters.endDate}`);
        }

        const whereConditions = and(...conditions);

        const loanHistory = await db
          .select({
            id: loans.id,
            bookId: loans.bookId,
            loanDate: loans.loanDate,
            dueDate: loans.dueDate,
            returnDate: loans.returnDate,
            status: loans.status,
            renewalCount: loans.renewalCount,
            notes: loans.notes,
            createdAt: loans.createdAt,
            updatedAt: loans.updatedAt,
            book: {
              id: books.id,
              title: books.title,
              authors: books.authors,
              thumbnail: books.thumbnail,
            },
          })
          .from(loans)
          .leftJoin(books, eq(loans.bookId, books.id))
          .where(whereConditions)
          .orderBy(desc(loans.createdAt))
          .limit(filters.limit)
          .offset(offset);

        const totalCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(loans)
          .where(whereConditions);

        return {
          history: loanHistory,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: totalCount[0]?.count || 0,
            totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
          },
        };
      } catch (error) {
        return {
          error: "Failed to fetch loan history",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal("active"),
            t.Literal("returned"),
            t.Literal("overdue"),
          ]),
        ),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    },
  );
