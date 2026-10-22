import { QueryClient } from '@tanstack/react-query';
import { ServiceError } from '../services/types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => !(error instanceof ServiceError && error.status < 500) && count < 1,
    },
    mutations: { retry: false },
  },
});
