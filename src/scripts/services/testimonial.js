import { testimonialContent } from '../data/testimonial.js';
import portrait from '../../assets/testimonial/portrait.png';

export async function getTestimonials() {
  const content = structuredClone(testimonialContent);
  content.stories = content.stories.map(story => ({ ...story, image: portrait }));
  return content;
}
