import { getPublicContent } from './content';
import { ServiceError, type SampleScenario, type ServiceOptions } from '../types';
import type { HeroContent } from '../hero-types';
export async function getHero(scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<HeroContent | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Hero content is unavailable. Please try again.', 'SAMPLE_HERO_ERROR', 400);
  return scenario === 'empty' ? null : await getPublicContent('hero', { signal });
}
