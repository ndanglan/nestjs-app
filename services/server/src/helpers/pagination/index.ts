import { CursorPaginationParams, CursorPaginatedResult } from './type';

export class CursorPaginationHelper {
  static getCursorParams(params: CursorPaginationParams) {
    const take = Number(params.take) || 10;
    // Lấy thêm 1 item để kiểm tra có page tiếp theo không
    const limit = take + 1;
    const cursor = params.cursor ? Number(params.cursor) : 0;
    const sortBy = params.sortBy ?? 'id';
    const sortOrder = params.sortOrder ?? 'asc';

    return {
      take: limit,
      cursor,
      sortBy,
      sortOrder,
      search: params.search,
    };
  }

  static createCursorPaginatedResponse<T extends { id: number }>(
    data: T[],
    params: CursorPaginationParams,
  ): CursorPaginatedResult<T> {
    const take = Number(params.take) || 10;
    const hasNextPage = data.length > take;

    // Nếu có next page, bỏ item cuối ra khỏi results
    const items = hasNextPage ? data.slice(0, take) : data;

    // Lấy cursors
    const nextCursor = hasNextPage ? items[items.length - 1].id : undefined;
    const prevCursor = items.length > 0 ? items[0].id : undefined;

    return {
      data: items,
      meta: {
        hasNextPage,
        nextCursor,
        prevCursor,
        take,
      },
    };
  }
}
