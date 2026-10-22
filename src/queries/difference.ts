import { useQuery } from '@tanstack/react-query';
import { getDifference } from '../services/difference';
import type { SampleScenario } from '../services/types';
export const differenceKeys = { content: (scenario: SampleScenario) => ['landing', 'difference', scenario] as const };
export function useDifference(scenario: SampleScenario) {
  return useQuery({ queryKey: differenceKeys.content(scenario), queryFn: ({ signal }) => getDifference(scenario, { signal }) });
}
