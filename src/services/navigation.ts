import { getPublicContent } from './content';
import { type ServiceOptions, type SampleScenario } from './types';
import type { NavigationContent } from './navigation-types';

export async function getNavigation(_scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<NavigationContent | null> {
  signal?.throwIfAborted();
  return await getPublicContent('navbar', { signal });
}
export { getSession as getNavbarAccount } from './auth';
