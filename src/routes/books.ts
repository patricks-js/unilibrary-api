import { eq, inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { books } from "../db/schema/books";
import { googleBooksService } from "../lib/google-books";
import { bookIdSchema, bookSearchSchema } from "../lib/validation";

export const booksRoutes = new Elysia({ prefix: "/books" })
  .get(
    "/",
    async ({ query }) => {
      try {
        const searchParams = bookSearchSchema.parse(query);

        const googleBooksResponse =
          await googleBooksService.searchBooks(searchParams);

        if (!googleBooksResponse.items) {
          return {
            books: [],
            totalItems: 0,
            startIndex: searchParams.startIndex,
            maxResults: searchParams.maxResults,
          };
        }

        const transformedBooks = googleBooksResponse.items.map((book) =>
          googleBooksService.transformGoogleBookToInternal(book),
        );

        const bookIds = transformedBooks.map((book) => book.id);
        const existingBooks =
          bookIds.length > 0
            ? await db
                .select()
                .from(books)
                .where(inArray(books.id, bookIds))
            : [];

        const booksWithAvailability = transformedBooks.map((book) => {
          const existingBook = existingBooks.find((eb) => eb.id === book.id);
          return {
            ...book,
            isAvailable: existingBook?.isAvailable ?? book.isAvailable,
            totalCopies: existingBook?.totalCopies ?? book.totalCopies,
            availableCopies:
              existingBook?.availableCopies ?? book.availableCopies,
          };
        });

        return {
          books: booksWithAvailability,
          totalItems: googleBooksResponse.totalItems,
          startIndex: searchParams.startIndex,
          maxResults: searchParams.maxResults,
        };
      } catch (error) {
        return {
          error: "Failed to fetch books",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        intitle: t.Optional(t.String()),
        inauthor: t.Optional(t.String()),
        inpublisher: t.Optional(t.String()),
        subject: t.Optional(t.String()),
        isbn: t.Optional(t.String()),
        startIndex: t.Optional(t.String()),
        maxResults: t.Optional(t.String()),
        orderBy: t.Optional(
          t.Union([t.Literal("relevance"), t.Literal("newest")]),
        ),
        printType: t.Optional(
          t.Union([
            t.Literal("all"),
            t.Literal("books"),
            t.Literal("magazines"),
          ]),
        ),
        filter: t.Optional(
          t.Union([
            t.Literal("partial"),
            t.Literal("full"),
            t.Literal("free-ebooks"),
            t.Literal("paid-ebooks"),
            t.Literal("ebooks"),
          ]),
        ),
        langRestrict: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params }) => {
      try {
        const { id } = bookIdSchema.parse(params);

        const existingBook = await db
          .select()
          .from(books)
          .where(eq(books.id, id))
          .limit(1);

        if (existingBook.length > 0) {
          return existingBook[0];
        }

        const googleBook = await googleBooksService.getBookById(id);

        if (!googleBook) {
          return {
            error: "Book not found",
            message: `Book with ID ${id} does not exist`,
          };
        }

        const transformedBook =
          googleBooksService.transformGoogleBookToInternal(googleBook);

        try {
          await db.insert(books).values(transformedBook);
        } catch (insertError) {
          console.warn("Failed to save book to database:", insertError);
        }

        return transformedBook;
      } catch (error) {
        return {
          error: "Failed to fetch book",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
