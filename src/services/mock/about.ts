import { getPublicContent } from './content';
import { ServiceError, type SampleScenario, type ServiceOptions } from '../types';
import type { AboutContent } from '../landing-sections-types';
export async function getAbout(scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<AboutContent | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('About content is unavailable. Please try again.', 'SAMPLE_ABOUT_ERROR', 400);
  return scenario === 'empty' ? null : await getPublicContent('about', { signal });
}
