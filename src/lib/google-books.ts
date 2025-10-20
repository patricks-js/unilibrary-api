import { env } from "./env";

export interface GoogleBooksVolume {
  kind: string;
  id: string;
  etag: string;
  selfLink: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    readingModes?: {
      text: boolean;
      image: boolean;
    };
    pageCount?: number;
    printType?: string;
    categories?: string[];
    maturityRating?: string;
    allowAnonLogging?: boolean;
    contentVersion?: string;
    panelizationSummary?: {
      containsEpubBubbles: boolean;
      containsImageBubbles: boolean;
    };
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
    };
    language?: string;
    previewLink?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
    averageRating?: number;
    ratingsCount?: number;
  };
  saleInfo?: {
    country?: string;
    saleability?: string;
    isEbook?: boolean;
  };
  accessInfo?: {
    country?: string;
    viewability?: string;
    embeddable?: boolean;
    publicDomain?: boolean;
    textToSpeechPermission?: string;
    epub?: {
      isAvailable: boolean;
    };
    pdf?: {
      isAvailable: boolean;
      acsTokenLink?: string;
    };
    webReaderLink?: string;
    accessViewStatus?: string;
    quoteSharingAllowed?: boolean;
  };
  searchInfo?: {
    textSnippet?: string;
  };
}

export interface GoogleBooksResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBooksVolume[];
}

export interface BookSearchParams {
  q?: string;
  intitle?: string;
  inauthor?: string;
  inpublisher?: string;
  subject?: string;
  isbn?: string;
  lccn?: string;
  oclc?: string;
  startIndex?: number;
  maxResults?: number;
  orderBy?: "relevance" | "newest";
  printType?: "all" | "books" | "magazines";
  filter?: "partial" | "full" | "free-ebooks" | "paid-ebooks" | "ebooks";
  langRestrict?: string;
  [key: string]: string | number | undefined;
}

export class GoogleBooksService {
  private baseUrl = "https://www.googleapis.com/books/v1";
  private apiKey = env.GOOGLE_BOOKS_API_KEY;

  private buildUrl(
    endpoint: string,
    params: Record<string, string | number | undefined> = {},
  ): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    for(const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.append(key, String(value));
    }

    if (this.apiKey) {
      url.searchParams.append("key", this.apiKey);
    }

    return url.toString();
  }

  async searchBooks(params: BookSearchParams): Promise<GoogleBooksResponse> {
    // Constrói a query string baseada nos parâmetros
    let query = "";
    
    if (params.q) {
      query = params.q;
    } else {
      // Constrói query específica baseada nos filtros
      const queryParts: string[] = [];
      
      if (params.intitle) queryParts.push(`intitle:${params.intitle}`);
      if (params.inauthor) queryParts.push(`inauthor:${params.inauthor}`);
      if (params.inpublisher) queryParts.push(`inpublisher:${params.inpublisher}`);
      if (params.subject) queryParts.push(`subject:${params.subject}`);
      if (params.isbn) queryParts.push(`isbn:${params.isbn}`);
      
      query = queryParts.length > 0 ? queryParts.join(" ") : "books";
    }
    
    const url = this.buildUrl(`/volumes?q=${encodeURIComponent(query)}`, params);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Google Books API error: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as GoogleBooksResponse;
    } catch (error) {
      console.error("Error fetching books from Google Books API:", error);
      throw error;
    }
  }

  async getBookById(bookId: string): Promise<GoogleBooksVolume | null> {
    const url = this.buildUrl(`/volumes/${bookId}`);

    try {
      const response = await fetch(url);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `Google Books API error: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as GoogleBooksVolume;
    } catch (error) {
      console.error("Error fetching book from Google Books API:", error);
      throw error;
    }
  }

  transformGoogleBookToInternal(googleBook: GoogleBooksVolume) {
    const volumeInfo = googleBook.volumeInfo;
    const isbn10 = volumeInfo.industryIdentifiers?.find(
      (id) => id.type === "ISBN_10",
    )?.identifier;
    const isbn13 = volumeInfo.industryIdentifiers?.find(
      (id) => id.type === "ISBN_13",
    )?.identifier;

    return {
      id: googleBook.id,
      title: volumeInfo.title,
      authors: volumeInfo.authors || [],
      description: volumeInfo.description,
      publishedDate: volumeInfo.publishedDate,
      publisher: volumeInfo.publisher,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories || [],
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
      thumbnail:
        volumeInfo.imageLinks?.thumbnail ||
        volumeInfo.imageLinks?.smallThumbnail,
      language: volumeInfo.language || "en",
      isbn10,
      isbn13,
      previewLink: volumeInfo.previewLink,
      infoLink: volumeInfo.infoLink,
      canonicalVolumeLink: volumeInfo.canonicalVolumeLink,
      isAvailable: true,
      totalCopies: 1,
      availableCopies: 1,
      kind: googleBook.kind,
      etag: googleBook.etag,
      selfLink: googleBook.selfLink,
      saleInfo: googleBook.saleInfo,
      accessInfo: googleBook.accessInfo,
      searchInfo: googleBook.searchInfo,
    };
  }
}

export const googleBooksService = new GoogleBooksService();
