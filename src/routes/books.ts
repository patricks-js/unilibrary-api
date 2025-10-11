import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { books } from "../db/schema/books";
import { googleBooksService } from "../lib/google-books";
import { bookIdSchema, bookSearchSchema } from "../lib/validation";

export const booksRoutes = new Elysia({ prefix: "/books" })
  // GET /books - Search and list books
  .get(
    "/",
    async ({ query }) => {
      try {
        const searchParams = bookSearchSchema.parse(query);

        // Search books from Google Books API
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

        // Transform Google Books data to our internal format
        const transformedBooks = googleBooksResponse.items.map((book) =>
          googleBooksService.transformGoogleBookToInternal(book),
        );

        // Check availability in our database for each book
        const bookIds = transformedBooks.map((book) => book.id);
        const existingBooks =
          bookIds.length > 0
            ? await db
                .select()
                .from(books)
                .where(sql`${books.id} = ANY(${bookIds})`)
            : [];

        // Merge availability data
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

  // GET /books/:id - Get book details
  .get(
    "/:id",
    async ({ params }) => {
      try {
        const { id } = bookIdSchema.parse(params);

        // First check if we have the book in our database
        const existingBook = await db
          .select()
          .from(books)
          .where(eq(books.id, id))
          .limit(1);

        if (existingBook.length > 0) {
          return existingBook[0];
        }

        // If not in our database, fetch from Google Books API
        const googleBook = await googleBooksService.getBookById(id);

        if (!googleBook) {
          return {
            error: "Book not found",
            message: `Book with ID ${id} does not exist`,
          };
        }

        // Transform and return the book data
        const transformedBook =
          googleBooksService.transformGoogleBookToInternal(googleBook);

        // Optionally save to our database for future use
        try {
          await db.insert(books).values(transformedBook);
        } catch (insertError) {
          // Ignore insert errors (book might already exist)
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
