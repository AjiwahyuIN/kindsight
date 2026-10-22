import { getPublicContent } from './content';
import { type SampleScenario, type ServiceOptions } from './types';
import type { HeroContent } from './hero-types';
export async function getHero(_scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<HeroContent | null> {
  signal?.throwIfAborted();
  return await getPublicContent('hero', { signal });
}
