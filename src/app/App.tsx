import { LocalDataSync } from './LocalDataSync';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { queryClient } from './query-client';
import { router } from './router';

export function App() {
  return <QueryClientProvider client={queryClient}><LocalDataSync/><RouterProvider router={router} /></QueryClientProvider>;
}
