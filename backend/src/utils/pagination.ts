/**
 * Build a consistent pagination response envelope.
 * 
 * Usage:
 *   const result = paginate(items, page, limit);
 *   res.json({ success: true, ...result });
 */
export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = items.slice(start, end);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

/** Allowed sort fields for logs endpoint — prevents arbitrary field access */
export const ALLOWED_LOG_SORT_FIELDS = [
  'timestamp', 'mrr', 'status', 'customerName', 'companyName', 'scenario',
] as const;
