import { getPublicContent } from './content';
import { ServiceError, type SampleScenario, type ServiceOptions } from '../types';
import type { TestimonialsContent } from '../landing-sections-types';
export async function getTestimonials(scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<TestimonialsContent | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Testimonials content is unavailable. Please try again.', 'SAMPLE_TESTIMONIALS_ERROR', 400);
  return scenario === 'empty' ? null : await getPublicContent('testimonials', { signal });
}
