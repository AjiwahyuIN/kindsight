import { getPublicContent } from './content';
import { ServiceError, type SampleScenario, type ServiceOptions } from '../types';
import type { FooterContent, NewsletterScenario, NewsletterPreview } from '../footer-types';

export async function getFooter(scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<FooterContent | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Footer content is unavailable. Please try again.', 'SAMPLE_FOOTER_ERROR', 400);
  return scenario === 'empty' ? null : await getPublicContent('footer', { signal });
}
export async function previewNewsletter({ email, scenario = 'success' }: { email: string; scenario?: NewsletterScenario }): Promise<NewsletterPreview> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new ServiceError('Please enter a valid email.', 'INVALID_EMAIL', 400);
  if (scenario === 'error') throw new ServiceError('Preview unavailable. Please try again.', 'SAMPLE_NEWSLETTER_ERROR', 400);
  return { message: 'Thank you! This is a local preview; no subscription has been created.', subscribed: false };
}
