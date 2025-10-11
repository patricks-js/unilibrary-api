import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const books = pgTable("books", {
  id: text("id").primaryKey(), // External API book ID
  title: text("title").notNull(),
  authors: jsonb("authors").notNull(), // Array of author names
  description: text("description"),
  publishedDate: text("published_date"),
  publisher: text("publisher"),
  pageCount: integer("page_count"),
  categories: jsonb("categories"), // Array of categories/genres
  averageRating: integer("average_rating"), // Rating from 1-5
  ratingsCount: integer("ratings_count"),
  thumbnail: text("thumbnail"), // Book cover image URL
  language: text("language").default("en"),
  isbn10: text("isbn_10"),
  isbn13: text("isbn_13"),
  previewLink: text("preview_link"),
  infoLink: text("info_link"),
  canonicalVolumeLink: text("canonical_volume_link"),
  isAvailable: boolean("is_available").default(true).notNull(),
  totalCopies: integer("total_copies").default(1).notNull(),
  availableCopies: integer("available_copies").default(1).notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const loans = pgTable("loans", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  loanDate: timestamp("loan_date")
    .$defaultFn(() => new Date())
    .notNull(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
  status: text("status", {
    enum: ["active", "returned", "overdue"],
  })
    .default("active")
    .notNull(),
  renewalCount: integer("renewal_count").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const wishlist = pgTable("wishlist", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  priority: integer("priority").default(1).notNull(), // 1-5 priority level
  notes: text("notes"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const readingStatus = pgTable("reading_status", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["want_to_read", "currently_reading", "read", "did_not_finish"],
  }).notNull(),
  currentPage: integer("current_page").default(0),
  progressPercentage: integer("progress_percentage").default(0), // 0-100
  rating: integer("rating"), // User's personal rating 1-5
  review: text("review"),
  startDate: timestamp("start_date"),
  finishDate: timestamp("finish_date"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const reservations = pgTable("reservations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  reservationDate: timestamp("reservation_date")
    .$defaultFn(() => new Date())
    .notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  status: text("status", {
    enum: ["pending", "fulfilled", "expired", "cancelled"],
  })
    .default("pending")
    .notNull(),
  priority: integer("priority").default(1).notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});
