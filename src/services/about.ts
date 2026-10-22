import { getPublicContent } from './content';
import { type SampleScenario, type ServiceOptions } from './types';
import type { AboutContent } from './landing-sections-types';
export async function getAbout(_scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<AboutContent | null> {
  signal?.throwIfAborted();
  return await getPublicContent('about', { signal });
}
