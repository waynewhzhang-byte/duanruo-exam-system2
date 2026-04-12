export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResult<T> {
  content: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function calculateOffset(page: number, size: number): number {
  return Math.max(0, page * size);
}

export function calculateTotalPages(total: number, size: number): number {
  return Math.ceil(total / size);
}

export function createPaginationResult<T>(
  items: T[],
  total: number,
  page: number,
  size: number,
): PaginatedResult<T> {
  const totalPages = calculateTotalPages(total, size);
  return {
    content: items,
    total,
    page,
    size,
    totalPages,
    hasNext: page < totalPages - 1,
    hasPrevious: page > 0,
  };
}

export async function paginateWithPrisma<T extends Record<string, unknown>>(
  model: {
    findMany: (args: unknown) => Promise<T[]>;
    count: (args: unknown) => Promise<number>;
  },
  params: PaginationParams,
  options: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Record<string, unknown>[];
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
  } = {},
): Promise<PaginatedResult<T>> {
  const { page, size } = params;
  const skip = calculateOffset(page, size);

  const [items, total] = await Promise.all([
    model.findMany({
      where: options.where,
      orderBy: options.orderBy,
      include: options.include,
      select: options.select,
      skip,
      take: size,
    }),
    model.count({
      where: options.where,
    }),
  ]);

  return createPaginationResult(items, total, page, size);
}
