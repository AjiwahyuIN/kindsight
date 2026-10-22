import { useMutation, useQuery } from '@tanstack/react-query';
import { getFooter, previewNewsletter } from '../services/footer';
import type { SampleScenario } from '../services/types';
export const footerKeys = { content: (scenario: SampleScenario) => ['landing', 'footer', scenario] as const };
export function useFooter(scenario: SampleScenario) {
  return useQuery({ queryKey: footerKeys.content(scenario), queryFn: ({ signal }) => getFooter(scenario, { signal }) });
}
export function useNewsletterPreview() { return useMutation({ mutationFn: previewNewsletter }); }
