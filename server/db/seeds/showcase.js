import {showcaseOrganizationId} from '../migrations/004-organizations.js';
import { navigation } from '../../../src/scripts/data/navigation.js';
import { heroContent } from '../../../src/scripts/data/hero.js';
import { partners } from '../../../src/scripts/data/partners.js';
import { differenceContent } from '../../../src/scripts/data/difference.js';
import { aboutContent } from '../../../src/scripts/data/about.js';
import { solutionsContent } from '../../../src/scripts/data/solutions.js';
import { testimonialContent } from '../../../src/scripts/data/testimonial.js';
import { landingEndContent } from '../../../src/scripts/data/landing-end.js';

export const seedId = '001-showcase';
const donorA = '10000000-0000-4000-8000-000000000001';
const donorB = '10000000-0000-4000-8000-000000000002';
const campaignA = '20000000-0000-4000-8000-000000000001';
const campaignB = '20000000-0000-4000-8000-000000000002';

export async function seedShowcase(connection) {
  await connection.execute('INSERT INTO donors (organization_id, id, name, email, organization) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)', [
    showcaseOrganizationId, donorA, 'Alex Morgan (Sample)', 'alex@example.com', 'Sample Foundation',
    showcaseOrganizationId, donorB, 'Taylor Reed (Sample)', 'taylor@example.com', null,
  ]);
  await connection.execute('INSERT INTO campaigns (organization_id, id, name, description, target_amount, starts_on, ends_on, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)', [
    showcaseOrganizationId, campaignA, 'Community Care (Sample)', 'Fictional campaign for the local showcase.', '25000.00', '2026-01-01', '2026-12-31', 'active',
    showcaseOrganizationId, campaignB, 'Education Access (Sample)', 'Fictional education fundraising campaign.', '50000.00', '2026-01-01', '2026-12-31', 'active',
  ]);
  const donations = [
    [donorA, campaignA, '10000.00', 'received', '2026-09-10 10:00:00.000', null],
    [donorB, campaignB, '5000.00', 'received', '2026-10-05 10:00:00.000', null],
    [null, null, '250.00', 'received', '2026-10-15 10:00:00.000', null],
    [donorA, campaignA, '750.00', 'pending', null, '2026-10-30 10:00:00.000'],
    [null, campaignB, '100.00', 'cancelled', null, null],
  ];
  for (const [index, donation] of donations.entries()) {
    await connection.execute('INSERT INTO donations (organization_id, id, donor_id, campaign_id, amount, status, received_at, expected_at, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      showcaseOrganizationId, `30000000-0000-4000-8000-00000000000${index + 1}`, ...donation, 'Fictional showcase record; not a real payment.',
    ]);
  }
  const sections = {
    navigation, hero: heroContent, partners, difference: differenceContent, about: aboutContent,
    solutions: solutionsContent, testimonial: testimonialContent,
    ...landingEndContent,
  };
  for (const [key, value] of Object.entries(sections)) {
    await connection.execute('INSERT INTO landing_sections (section_key, content_json) VALUES (?, ?)', [key, JSON.stringify(value)]);
  }
  // Admin credentials are intentionally provisioned with the login phase, not a shared sample password.
}
