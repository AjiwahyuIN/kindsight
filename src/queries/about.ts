import { useQuery } from '@tanstack/react-query';
import { getAbout } from '../services/about';
import type { SampleScenario } from '../services/types';
export const aboutKeys = { content: (scenario: SampleScenario) => ['landing', 'about', scenario] as const };
export function useAbout(scenario: SampleScenario) {
  return useQuery({ queryKey: aboutKeys.content(scenario), queryFn: ({ signal }) => getAbout(scenario, { signal }) });
}
