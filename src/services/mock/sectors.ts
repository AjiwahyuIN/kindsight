import { getPublicContent } from './content';
import { ServiceError, type SampleScenario, type ServiceOptions } from '../types';
import type { SectorsContent } from '../landing-sections-types';
export async function getSectors(scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<SectorsContent | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Sectors content is unavailable. Please try again.', 'SAMPLE_SECTORS_ERROR', 400);
  return scenario === 'empty' ? null : await getPublicContent('sectors', { signal });
}
