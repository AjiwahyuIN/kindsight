import type { AboutContent } from '../services/landing-sections-types';
export const aboutContent: AboutContent = {
  label: 'About Kindsight',
  heading: ['Kindsight is a fundraising', 'intelligence platform.'],
  description: 'fundraising teams can move with confidence—spending less time on guesswork and more time advancing their mission.',
  // Marketing examples from the design. These are not live dashboard totals.
  statistics: [
    { id: 'organizations', value: '3,000', suffix: '+', label: 'organizations supported' },
    { id: 'funds', value: '$8B', suffix: '+', label: 'funds raised using Kindsight' },
    { id: 'experience', value: '20', suffix: '+', label: 'years of fundraising intelligence' },
  ],
};
