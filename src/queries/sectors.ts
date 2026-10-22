import { useQuery } from '@tanstack/react-query';
import { getSectors } from '../services/sectors';
import type { SampleScenario } from '../services/types';
export const sectorsKeys = { content: (scenario: SampleScenario) => ['landing', 'sectors', scenario] as const };
export function useSectors(scenario: SampleScenario) {
  return useQuery({ queryKey: sectorsKeys.content(scenario), queryFn: ({ signal }) => getSectors(scenario, { signal }) });
}
