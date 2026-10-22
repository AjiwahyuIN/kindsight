import { getPublicContent } from './content';
import { type SampleScenario, type ServiceOptions } from './types';
import type { DifferenceContent } from './difference-types';
export async function getDifference(_scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<DifferenceContent | null> {
  signal?.throwIfAborted();
  return await getPublicContent('difference', { signal });
}
