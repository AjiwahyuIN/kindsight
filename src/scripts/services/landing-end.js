import { landingEndContent } from '../data/landing-end.js';
import { getPublicContent } from './content.js';

export async function getLandingEndContent() {
  return {...structuredClone(landingEndContent),footer:await getPublicContent('footer')};
}

// Replace with an API request during the backend phase. No subscription is stored.
export async function previewNewsletter(email) {
  if (!email.trim()) throw new Error('Please enter your email.');
  return { message: 'Thank you! This is a local preview; no subscription has been created.' };
}
