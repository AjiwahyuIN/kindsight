import { useQuery } from '@tanstack/react-query';
import { getMissions } from '../services/missions';
import type { SampleScenario } from '../services/types';
export const missionsKeys = { content: (scenario: SampleScenario) => ['landing', 'missions', scenario] as const };
export function useMissions(scenario: SampleScenario) {
  return useQuery({ queryKey: missionsKeys.content(scenario), queryFn: ({ signal }) => getMissions(scenario, { signal }) });
}
