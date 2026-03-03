import { useCallback, useState } from 'react';

export function usePagination(initial?: { page?: number; limit?: number }) {
  const [page, setPage] = useState(initial?.page ?? 1);
  const [limit, setLimit] = useState(initial?.limit ?? 20);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    setPage,
    setLimit: (next: number) => {
      setLimit(next);
      setPage(1);
    },
    reset,
  };
}

