import { getPublicContent } from './content';
import { type SampleScenario, type ServiceOptions } from './types';
import type { MissionsContent } from './landing-sections-types';
export async function getMissions(_scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<MissionsContent | null> {
  signal?.throwIfAborted();
  return await getPublicContent('missions', { signal });
}
