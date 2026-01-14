export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export class PaginationHelper {
  static createResponse<T>(
    items: T[],
    total: number,
    page: number,
    size: number,
  ): PaginatedResponse<T> {
    return {
      content: items,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
    };
  }
}
