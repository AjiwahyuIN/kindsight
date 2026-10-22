import type { SolutionsContent } from '../services/landing-sections-types';
import asset0 from '../assets/solutions/platform.svg';
import asset1 from '../assets/solutions/fundraising-team.png';
import asset2 from '../assets/solutions/ascend.svg';
import asset3 from '../assets/solutions/iwave.svg';
export const solutionsContent: SolutionsContent = {
  label: 'Solutions',
  // Correct the source design's spelling of “incredibe”.
  heading: ['Our incredible', 'solutions'],
  description: 'Our platform adapts to the unique goals, challenges, and donor ecosystems of each sector.',
  products: [
    {
      id: 'platform',
      featured: true,
      title: 'Fundraising Platform',
      description: 'The only fundraising CRM powered by real-time donor intelligence.',
      icon: asset0,
      cta: 'Learn More',
      image: {
        src: asset1,
        alt: 'Two people laughing together.',
        badge: { value: '12', label: 'Hidden Gems', detail: 'prospect' },
      },
    },
    {
      id: 'ascend',
      title: 'Ascend',
      description: 'The award-winning CRM built on Salesforce, built for fundraising teams.',
      icon: asset2,
    },
    {
      id: 'iwave',
      title: 'iWave',
      description: 'Comprehensive donor data and real-time live profiles.',
      icon: asset3,
    },
  ],
  // Example content for the otherwise unspecified Learn More destination.
  overview: {
    title: 'Fundraising Platform',
    description: 'Explore fundraising powered by donor intelligence.',
    note: 'This is a sample overview. Full product details will be added later.',
    topics: [
      { title: 'Fundraising CRM', description: 'Bring fundraising work and supporter information into one view.' },
      { title: 'Donor intelligence', description: 'Explore information that can help your team identify potential supporters.' },
      { title: 'Real-time insights', description: 'Use current donor information to inform the next step in your fundraising work.' },
    ],
  },
};
