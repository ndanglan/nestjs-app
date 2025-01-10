export interface CursorPaginationParams {
  take?: number;
  cursor?: string | number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginatedResult<T> {
  data: T[];
  meta: {
    hasNextPage: boolean;
    nextCursor?: string | number;
    prevCursor?: string | number;
    take: number;
  };
}
