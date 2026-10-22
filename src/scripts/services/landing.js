import { getPublicContent } from './content.js';

export async function getHeroContent() {
  return getPublicContent('hero');
}
