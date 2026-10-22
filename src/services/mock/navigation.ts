import { getPublicContent } from './content';
import { sampleNavbarAccount } from '../../data/navigation';
import { ServiceError, type ServiceOptions, type SampleScenario } from '../types';
import type { NavigationContent, SampleAccount, AccountScenario } from '../navigation-types';

export async function getNavigation(scenario: SampleScenario = 'success', { signal }: ServiceOptions = {}): Promise<NavigationContent | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Navigation is unavailable. Please try again.', 'SAMPLE_NAVIGATION_ERROR', 400);
  return scenario === 'empty' ? null : await getPublicContent('navbar', { signal });
}
export async function getNavbarAccount(scenario: AccountScenario = 'guest', { signal }: ServiceOptions = {}): Promise<SampleAccount | null> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Unable to check your account. Please try again.', 'SAMPLE_ACCOUNT_ERROR', 400);
  return scenario === 'admin' ? structuredClone(sampleNavbarAccount) : null;
}
export async function previewDemoRequest(details: DemoDetails): Promise<DemoPreview> {
  const name = details.name.trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) throw new ServiceError('Please enter your name and a valid email.', 'INVALID_DEMO_PREVIEW', 400);
  return { name, sent: false };
}

// Legacy preview fixture types; the active public form uses the REST demo service.
type DemoDetails={name:string;email:string;organization:string};
type DemoPreview={name:string;sent:false};
