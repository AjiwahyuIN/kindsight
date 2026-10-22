import type { HeroContent, HeroIllustration } from '../services/hero-types';
export const heroContent: HeroContent = {
  socialProof: 'Loved by over 1 million Users', heading: 'Fundraising intelligence', connector: 'that', highlight: 'unlocks opportunities',
  description: 'Forget stale spreadsheets and ancient tools. With Kindsight, you get real-time insights that help you find major supporters.',
  demoLabel: 'Request a Demo', overviewLabel: 'Watch Overview',
  overview: [
    { title: 'Find your next major supporter.', description: 'Explore donor intelligence to identify people who share your mission and have the capacity to give.' },
    { title: 'Build stronger relationships.', description: 'Bring donor information and engagement together so your team can focus on meaningful connections.' },
    { title: 'Move your mission forward.', description: 'See fundraising progress and promising opportunities together, then plan your team’s next steps.' },
  ],
};
export const heroIllustration: HeroIllustration = {
  raised: '$18,425', cents: '.98', growth: '+12,4%', majorGifts: '162', forecasted: '$1,24', pending: '$750', insights: '29',
  bars: [62, 43, 55, 78, 51, 45, 77],
  prospects: [
    { name: 'John Reynolds', capacity: 'High', gift: '$67k', engagement: 'Meet 3 days ago', status: 'Active', image: 'prospect-1' },
    { name: 'Linda Carter', capacity: 'Medium', gift: '$15k', engagement: 'Attended event', status: 'Follow-up', image: 'prospect-2' },
  ],
};
