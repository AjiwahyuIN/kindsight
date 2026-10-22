import { aboutContent } from '../data/about.js';

export async function getAboutContent() {
  return structuredClone(aboutContent);
}
