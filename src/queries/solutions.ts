import { useQuery } from '@tanstack/react-query';
import { getSolutions } from '../services/solutions';
import type { SampleScenario } from '../services/types';
export const solutionsKeys = { content: (scenario: SampleScenario) => ['landing', 'solutions', scenario] as const };
export function useSolutions(scenario: SampleScenario) {
  return useQuery({ queryKey: solutionsKeys.content(scenario), queryFn: ({ signal }) => getSolutions(scenario, { signal }) });
}
