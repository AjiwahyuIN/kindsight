import type { NavigationContent, SampleAccount } from '../services/navigation-types';

// Typed React fixtures; the original JS fixtures remain for the Pug/backend reference.
export const navigationContent: NavigationContent = {
  brandName: 'Kindsight', demoLabel: 'Get a Demo', productBadge: 'New',
  labels: { serve: 'Who we Serve', product: 'Product', company: 'Company', resources: 'Resources' },
  groups: {
    serve: [
      { id: 'nonprofits', label: 'Nonprofits', description: 'Find the supporters who share your mission.', href: '' },
      { id: 'healthcare', label: 'Healthcare', description: 'Build relationships that advance care.', href: '' },
      { id: 'education', label: 'Education', description: 'Turn alumni connections into lifelong support.', href: '' },
    ],
    product: [
      { id: 'platform', label: 'Fundraising Platform', description: 'Fundraising powered by donor intelligence.', href: '' },
      { id: 'ascend', label: 'Ascend', description: 'A fundraising CRM built on Salesforce.', href: '' },
      { id: 'iwave', label: 'iWave', description: 'Donor research and real-time insights.', href: '' },
    ],
    resources: [
      { id: 'resource-hub', label: 'Resource Hub', description: 'Ideas and practical fundraising resources.', href: '' },
      { id: 'blog', label: 'Blog', description: 'Perspectives from the fundraising community.', href: '' },
      { id: 'events', label: 'Events & Webinars', description: 'Learn and connect with fellow practitioners.', href: '' },
    ],
  },
  company: { id: 'company', label: 'About Kindsight', description: 'Built on care, community, and commitment to your mission.', href: '' },
};
export const sampleNavbarAccount: SampleAccount = { name: 'Sample Admin', email: 'admin@example.test' };
