import { useQuery } from '@tanstack/react-query';
import { getPartners } from '../services/partners';
import type { SampleScenario } from '../services/types';
import type { PartnerSelection } from '../services/partners-types';
export const partnersKeys = { content: (scenario: SampleScenario, selection: PartnerSelection) => ['landing', 'partners', scenario, selection] as const };
export function usePartners(scenario: SampleScenario, selection: PartnerSelection) {
  return useQuery({ queryKey: partnersKeys.content(scenario, selection), queryFn: ({ signal }) => getPartners(scenario, selection, { signal }) });
}
