import { useSearchParams } from 'react-router';
import { Button } from '../ui/Button';
import { StatusMessage } from '../ui/StatusMessage';
import type { SampleScenario } from '../../services/types';

export function useSectionScenario(section: string): SampleScenario {
  const [params] = useSearchParams();
  const raw = params.get(`${section}State`);
  return raw === 'empty' || raw === 'error' ? raw : 'success';
}
export function SectionDataState({ name, query, empty = false }: {
  name: string; empty?: boolean;
  query: { isPending: boolean; isError: boolean; isSuccess: boolean; data: unknown; error: Error | null; refetch: () => Promise<unknown> };
}) {
  return <>
    {query.isPending && <StatusMessage kind="loading">Loading {name} content…</StatusMessage>}
    {query.isError && <StatusMessage kind="error" action={<Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry {name}</Button>}>{query.error?.message}</StatusMessage>}
    {query.isSuccess && (!query.data || empty) && <StatusMessage kind="empty">No {name} content is available in this sample scenario.</StatusMessage>}
  </>;
}
