import { Context } from "hono";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  status?: string;
}

export function getPaginationParams(c: Context): PaginationParams {
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "10", 10)));
  const skip = (page - 1) * limit;
  const search = c.req.query("search") || undefined;
  const sortBy = c.req.query("sortBy") || "createdAt";
  const sortOrder = (c.req.query("sortOrder") || "desc") as "asc" | "desc";
  const status = c.req.query("status") || undefined;

  return { page, limit, skip, search, sortBy, sortOrder, status };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
