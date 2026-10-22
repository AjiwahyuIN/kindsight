import { getPublicContent } from './content';
import { type SampleScenario, type ServiceOptions } from './types';
import type { SectorsContent } from './landing-sections-types';
export async function getSectors(_scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<SectorsContent | null> {
  signal?.throwIfAborted();
  return await getPublicContent('sectors', { signal });
}
