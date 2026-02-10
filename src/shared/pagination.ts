export type PaginationInput = {
  page?: string;
  limit?: string;
};

export type PaginationConfig = {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
};

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
  take: number;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function parsePagination(
  input: PaginationInput,
  config: PaginationConfig = {},
): PaginationParams {
  const defaultPage = config.defaultPage ?? 1;
  const defaultLimit = config.defaultLimit ?? 20;
  const maxLimit = config.maxLimit ?? 100;

  const page = input.page ? Number(input.page) : defaultPage;
  const limit = input.limit ? Number(input.limit) : defaultLimit;

  if (!Number.isInteger(page) || page < 1) throw new Error('page is invalid');
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    throw new Error('limit is invalid');
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  params: { page: number; limit: number; total: number },
): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(params.total / params.limit));
  return {
    items,
    page: params.page,
    limit: params.limit,
    total: params.total,
    totalPages,
  };
}
