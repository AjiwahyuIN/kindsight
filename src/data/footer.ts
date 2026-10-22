import type { FooterContent, FooterLink } from '../services/footer-types';

const destinations: Record<string, string> = { iWave: '#solution-iwave-title', Ascend: '#solution-ascend-title', Platform: '#solutions', About: '#about' };
const links = (labels: string[]): FooterLink[] => labels.map(label => ({ label, href: destinations[label] ?? '' }));
// Same approved copy as the original landing fixture; legacy JS stays compatible with its backend.
export const footerContent: FooterContent = {
  heading: 'Don’t miss what’s next',
  description: 'By submitting your email, you’ll be the first to know about upcoming updates for Kindsight. You can unsubscribe at any time.',
  copyright: 'Kindsight 2025©',
  groups: [
    { title: 'Products', links: links(['iWave', 'Ascend', 'AdvancementRM', 'Connect', 'Collegiate Athletics Data', 'Platform', 'Integrations']) },
    { title: 'Resources', links: links(['Resource Hub', 'Blog', 'Events', 'Cheat Sheets', 'Case Sheets', 'Webinar']) },
    { title: 'Company', links: links(['About', 'Contact Us', 'Support', 'Press', 'FAQs', 'KindCon']) },
  ],
  legal: links(['Permission & Terms', 'Cookie policy', 'Privacy Policy']),
};
