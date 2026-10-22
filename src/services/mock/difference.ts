import { getPublicContent } from './content';
import { ServiceError, type SampleScenario, type ServiceOptions } from '../types';
import type { DifferenceContent } from '../difference-types';
export async function getDifference(scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<DifferenceContent | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Difference content is unavailable. Please try again.', 'SAMPLE_DIFFERENCE_ERROR', 400);
  return scenario === 'empty' ? null : await getPublicContent('difference', { signal });
}
