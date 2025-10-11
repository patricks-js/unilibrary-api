# University Library API

A RESTful API for managing a university library system with book search, loan management, wishlist, and reading status tracking.

## Features

- **Book Search**: Integration with Google Books API for searching and retrieving book information
- **Loan Management**: Create, track, and return book loans with due date management
- **Wishlist**: Add books to wishlist with priority levels and notes
- **Reading Status**: Track reading progress, ratings, and reviews
- **Authentication**: Secure user authentication using Better Auth
- **Database**: PostgreSQL with Drizzle ORM for data persistence

## API Endpoints

### Books

#### GET /books
Search and list books from Google Books API.

**Query Parameters:**
- `q` (optional): Search query
- `intitle` (optional): Search in title
- `inauthor` (optional): Search in author
- `inpublisher` (optional): Search in publisher
- `subject` (optional): Search by subject/category
- `isbn` (optional): Search by ISBN
- `startIndex` (optional): Starting index for pagination (default: 0)
- `maxResults` (optional): Maximum results per page (default: 20, max: 40)
- `orderBy` (optional): Sort order - "relevance" or "newest" (default: "relevance")
- `printType` (optional): Filter by print type - "all", "books", or "magazines" (default: "books")
- `filter` (optional): Additional filters
- `langRestrict` (optional): Language restriction

**Response:**
```json
{
  "books": [
    {
      "id": "book_id",
      "title": "Book Title",
      "authors": ["Author Name"],
      "description": "Book description",
      "publishedDate": "2023",
      "publisher": "Publisher Name",
      "pageCount": 300,
      "categories": ["Fiction"],
      "averageRating": 4.5,
      "ratingsCount": 100,
      "thumbnail": "https://...",
      "language": "en",
      "isbn10": "1234567890",
      "isbn13": "9781234567890",
      "previewLink": "https://...",
      "infoLink": "https://...",
      "canonicalVolumeLink": "https://...",
      "isAvailable": true,
      "totalCopies": 1,
      "availableCopies": 1,
      "kind": "books#volume",
      "etag": "unique_etag",
      "selfLink": "https://...",
      "saleInfo": {
        "country": "US",
        "saleability": "FOR_SALE",
        "isEbook": false
      },
      "accessInfo": {
        "country": "US",
        "viewability": "PARTIAL",
        "embeddable": true,
        "publicDomain": false,
        "textToSpeechPermission": "ALLOWED",
        "epub": { "isAvailable": false },
        "pdf": { "isAvailable": true },
        "webReaderLink": "https://...",
        "accessViewStatus": "SAMPLE",
        "quoteSharingAllowed": false
      },
      "searchInfo": {
        "textSnippet": "Book excerpt..."
      }
    }
  ],
  "totalItems": 1000,
  "startIndex": 0,
  "maxResults": 20
}
```

#### GET /books/:id
Get detailed information about a specific book.

**Response:**
```json
{
  "id": "book_id",
  "title": "Book Title",
  "authors": ["Author Name"],
  "description": "Book description",
  // ... other book fields
}
```

### Loans

#### GET /loans
Get user's active loans.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status - "active", "returned", "overdue"
- `startDate` (optional): Filter loans from this date
- `endDate` (optional): Filter loans until this date

#### POST /loans
Create a new loan.

**Request Body:**
```json
{
  "bookId": "book_id",
  "dueDate": "2024-01-15T00:00:00Z" // optional, defaults to 14 days from now
}
```

#### PATCH /loans/:loanId/return
Return a book.

**Request Body:**
```json
{
  "notes": "Optional return notes"
}
```

#### GET /loans/history
Get loan history with same query parameters as GET /loans.

### Wishlist

#### GET /wishlist
Get user's wishlist.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

#### POST /wishlist
Add book to wishlist.

**Request Body:**
```json
{
  "bookId": "book_id",
  "priority": 1, // 1-5, optional, default: 1
  "notes": "Optional notes"
}
```

#### DELETE /wishlist/:bookId
Remove book from wishlist.

#### PATCH /wishlist/:bookId
Update wishlist item.

**Request Body:**
```json
{
  "priority": 3, // 1-5
  "notes": "Updated notes"
}
```

### Reading Status

#### GET /reading
Get user's reading status for all books.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

#### GET /reading/:bookId
Get reading status for a specific book.

#### PUT /reading/:bookId
Create or update reading status.

**Request Body:**
```json
{
  "status": "currently_reading", // "want_to_read", "currently_reading", "read", "did_not_finish"
  "currentPage": 150, // optional
  "progressPercentage": 50, // optional, 0-100
  "rating": 4, // optional, 1-5
  "review": "Great book!", // optional
  "startDate": "2024-01-01T00:00:00Z", // optional
  "finishDate": "2024-01-15T00:00:00Z" // optional
}
```

#### DELETE /reading/:bookId
Remove reading status for a book.

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/unilibrary
GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here
PORT=3000
NODE_ENV=development
```

### Getting a Google Books API Key

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the "Books API" in the APIs & Services section
4. Go to "Credentials" and create an API key
5. Copy the API key to your `.env` file

**Note:** The API key is optional but recommended for better rate limits and reliability.

## Getting Started

1. Install dependencies:
```bash
bun install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate and run database migrations:
```bash
bun run db:generate
bun run db:migrate
```

4. Start the development server:
```bash
bun run dev
```

The API will be available at `http://localhost:3000`.

## Database Schema

The API uses the following main tables:

- `books`: Book information from Google Books API
- `loans`: Book loan records
- `wishlist`: User wishlist items
- `reading_status`: User reading progress and status
- `reservations`: Book reservations (for future use)

## Authentication

The API uses Better Auth for authentication. All protected endpoints require a valid session token in the Authorization header.

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
