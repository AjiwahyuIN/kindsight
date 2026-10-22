import { useQuery } from '@tanstack/react-query';
import { getFoundationPalette } from '../services/foundation';
import type { SampleScenario } from '../services/types';
export const foundationKeys = { palette: (scenario: SampleScenario) => ['foundation', 'palette', scenario] as const };
export function useFoundationPalette(scenario: SampleScenario) {
  return useQuery({ queryKey: foundationKeys.palette(scenario), queryFn: ({ signal }) => getFoundationPalette(scenario, { signal }) });
}
