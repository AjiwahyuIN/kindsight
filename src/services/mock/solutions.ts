import { getPublicContent } from './content';
import { ServiceError, type SampleScenario, type ServiceOptions } from '../types';
import type { SolutionsContent } from '../landing-sections-types';
export async function getSolutions(scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<SolutionsContent | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Solutions content is unavailable. Please try again.', 'SAMPLE_SOLUTIONS_ERROR', 400);
  return scenario === 'empty' ? null : await getPublicContent('solutions', { signal });
}
