import { getPublicContent } from './content';
import { type SampleScenario, type ServiceOptions } from './types';
import type { TestimonialsContent } from './landing-sections-types';
export async function getTestimonials(_scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<TestimonialsContent | null> {
  signal?.throwIfAborted();
  return await getPublicContent('testimonials', { signal });
}
