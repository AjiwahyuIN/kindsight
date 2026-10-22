import { getPublicContent } from './content';
import { type SampleScenario, type ServiceOptions } from './types';
import type { SolutionsContent } from './landing-sections-types';
export async function getSolutions(_scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<SolutionsContent | null> {
  signal?.throwIfAborted();
  return await getPublicContent('solutions', { signal });
}
