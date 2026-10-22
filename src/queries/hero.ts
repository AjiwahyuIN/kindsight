import { useQuery } from '@tanstack/react-query';
import { getHero } from '../services/hero';
import type { SampleScenario } from '../services/types';
export const heroKeys = { content: (scenario: SampleScenario) => ['landing', 'hero', scenario] as const };
export function useHero(scenario: SampleScenario) {
  return useQuery({ queryKey: heroKeys.content(scenario), queryFn: ({ signal }) => getHero(scenario, { signal }) });
}
