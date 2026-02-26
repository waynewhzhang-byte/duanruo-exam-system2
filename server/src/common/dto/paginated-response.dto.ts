export interface PaginatedResponse<T> {
  content: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    page: number;
    size: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class PaginationHelper {
  static createResponse<T>(
    items: T[],
    total: number,
    page: number,
    size: number,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / size);
    return {
      content: items,
      pagination: {
        totalItems: total,
        totalPages,
        page,
        size,
        hasNext: page < totalPages - 1,
        hasPrevious: page > 0,
      },
    };
  }
}
