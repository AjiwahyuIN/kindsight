import type { SectorsContent } from '../services/landing-sections-types';
import asset0 from '../assets/sectors/e935b.png';
import asset1 from '../assets/sectors/0e323.png';
import asset2 from '../assets/sectors/87ecc.svg';
import asset3 from '../assets/sectors/0d91d.png';
import asset4 from '../assets/sectors/badba.svg';
export const sectorsContent: SectorsContent = {
    label: 'Sector', heading: 'Each sector we serve', emphasis: 'Every organization is different.',
    description: ' Our platform adapts to the unique goals, challenges, and donor ecosystems of each sector.',
    donation: '$11,400.97', volunteers: '198 Volunteer', percentage: '52%',
    cards: [
      { id: 'nonprofits', title: 'Nonprofits', image: asset0, description: 'Explore how Kindsight helps nonprofit teams fund what matters most.' },
      { id: 'healthcare', title: 'Healthcare', image: asset1, icon: asset2, description: 'Identify high-capacity donors and increase funding outcomes.' },
      { id: 'education', title: 'Education', image: asset3, icon: asset4, description: 'Turn alumni data into lifelong support & strengthen alumni relationships and major gifts.' },
    ],
  };
