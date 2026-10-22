import { useQuery } from '@tanstack/react-query';
import { getTestimonials } from '../services/testimonials';
import type { SampleScenario } from '../services/types';
export const testimonialsKeys = { content: (scenario: SampleScenario) => ['landing', 'testimonials', scenario] as const };
export function useTestimonials(scenario: SampleScenario) {
  return useQuery({ queryKey: testimonialsKeys.content(scenario), queryFn: ({ signal }) => getTestimonials(scenario, { signal }) });
}
