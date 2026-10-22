import { useQuery } from '@tanstack/react-query';
import {useSession} from './auth';
import { getNavigation } from '../services/navigation';
import type { SampleScenario } from '../services/types';
import type { AccountScenario } from '../services/navigation-types';
export const navigationKeys = {
  content: (scenario: SampleScenario) => ['landing', 'navbar', scenario] as const,
  account: (scenario: AccountScenario) => ['session', 'navbar-sample', scenario] as const,
};
export function useNavigation(scenario: SampleScenario) {
  return useQuery({ queryKey: navigationKeys.content(scenario), queryFn: ({ signal }) => getNavigation(scenario, { signal }) });
}
export function useNavbarAccount(_scenario: AccountScenario, enabled: boolean) {
  return useSession(enabled);
}
