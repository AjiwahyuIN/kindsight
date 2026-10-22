import type { PartnerLogo } from '../services/partners-types';
import nature from '../assets/partners/nature-conservancy.svg';
import smithsonian from '../assets/partners/smithsonian-channel.svg';
import unicef from '../assets/partners/unicef.svg';
import hoag from '../assets/partners/hoag.svg';
import feeding from '../assets/partners/feeding-america.svg';

// Same local assets and crop geometry as the approved Pug reference.
export const partnerLogos: readonly PartnerLogo[] = [
  { id: 'nature-conservancy', name: 'The Nature Conservancy', src: nature, width: 560, height: 400, crop: { x: 100, y: 147.5, width: 360, height: 105 }, builtin: true },
  { id: 'smithsonian-channel', name: 'Smithsonian Channel', src: smithsonian, width: 236, height: 48, builtin: true },
  { id: 'unicef', name: 'UNICEF', src: unicef, width: 130.9, height: 31.5, builtin: true },
  { id: 'hoag', name: 'Hoag', src: hoag, width: 88, height: 36, builtin: true },
  { id: 'feeding-america', name: 'Feeding America', src: feeding, width: 675.68, height: 346.36, builtin: true },
];
