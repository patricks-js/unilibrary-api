import { z } from "zod";

export const bookSearchSchema = z.object({
  q: z.string().optional(),
  intitle: z.string().optional(),
  inauthor: z.string().optional(),
  inpublisher: z.string().optional(),
  subject: z.string().optional(),
  isbn: z.string().optional(),
  startIndex: z.coerce.number().min(0).default(0),
  maxResults: z.coerce.number().min(1).max(40).default(20),
  orderBy: z.enum(["relevance", "newest"]).default("relevance"),
  printType: z.enum(["all", "books", "magazines"]).default("books"),
  filter: z
    .enum(["partial", "full", "free-ebooks", "paid-ebooks", "ebooks"])
    .optional(),
  langRestrict: z.string().optional(),
});

export const bookIdSchema = z.object({
  id: z.string().min(1),
});

export const createLoanSchema = z.object({
  bookId: z.string().min(1),
  dueDate: z.coerce.date().optional(),
});

export const loanIdSchema = z.object({
  loanId: z.string().min(1),
});

export const returnLoanSchema = z.object({
  notes: z.string().optional(),
});

export const addToWishlistSchema = z.object({
  bookId: z.string().min(1),
  priority: z.number().min(1).max(5).default(1),
  notes: z.string().optional(),
});

export const wishlistBookIdSchema = z.object({
  bookId: z.string().min(1),
});

export const updateReadingStatusSchema = z.object({
  status: z.enum([
    "want_to_read",
    "currently_reading",
    "read",
    "did_not_finish",
  ]),
  currentPage: z.number().min(0).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  rating: z.number().min(1).max(5).optional(),
  review: z.string().optional(),
  startDate: z.coerce.date().optional(),
  finishDate: z.coerce.date().optional(),
});

export const readingStatusBookIdSchema = z.object({
  bookId: z.string().min(1),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const loanHistoryFiltersSchema = paginationSchema.extend({
  status: z.enum(["active", "returned", "overdue"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
