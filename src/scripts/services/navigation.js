import { getPublicContent } from './content.js';

export async function getNavigation() {
  return getPublicContent('navbar');
}

// Deliberately no persistence or network request in the frontend showcase.
export async function previewDemoRequest(details) {
  return { name: details.name.trim(), sent: false };
}
