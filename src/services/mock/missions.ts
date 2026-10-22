import { getPublicContent } from './content';
import { ServiceError, type SampleScenario, type ServiceOptions } from '../types';
import type { MissionsContent } from '../landing-sections-types';
export async function getMissions(scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<MissionsContent | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Missions content is unavailable. Please try again.', 'SAMPLE_MISSIONS_ERROR', 400);
  return scenario === 'empty' ? null : await getPublicContent('missions', { signal });
}
