export const getPagination = ({
  defaultLimit = 100,
  maxLimit = 500,
  query = {},
} = {}) => {
  const limit = Math.min(
    Math.max(Number.parseInt(query.limit, 10) || defaultLimit, 1),
    maxLimit
  );
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const skip = Math.max(Number.parseInt(query.skip, 10) || (page - 1) * limit, 0);

  return {
    limit,
    page,
    skip,
  };
};

export const setPaginationHeaders = (res, { count, limit, page, total }) => {
  res.setHeader("X-Pagination-Count", String(count));
  res.setHeader("X-Pagination-Limit", String(limit));
  res.setHeader("X-Pagination-Page", String(page));

  if (typeof total === "number") {
    res.setHeader("X-Pagination-Total", String(total));
  }
};
