import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseApiError } from './errors/app-error';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      suppressToast?: boolean;
    };
    queryMeta: {
      toastOnError?: boolean;
    };
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.toastOnError) {
        const appError = parseApiError(error);
        toast.error(appError.message);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressToast) return;
      const appError = parseApiError(error);
      toast.error(appError.message);
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const appError = parseApiError(error);
        // Do not retry predictable client errors (400, 401, 403, 404, 422)
        if ([400, 401, 403, 404, 409, 422].includes(appError.status)) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

