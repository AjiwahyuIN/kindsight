// Logo identities recorded in the Figma analysis. Assets are local brand-source equivalents.
// crop describes empty canvas around the original SVG, without altering its paths.
export const partners = [
  { id: 'nature-conservancy', name: 'The Nature Conservancy', file: 'nature-conservancy.svg', width: 560, height: 400, crop: { x: 100, y: 147.5, width: 360, height: 105 } },
  { id: 'smithsonian-channel', name: 'Smithsonian Channel', file: 'smithsonian-channel.svg', width: 236, height: 48 },
  { id: 'unicef', name: 'UNICEF', file: 'unicef.svg', width: 130.9, height: 31.5 },
  { id: 'hoag', name: 'Hoag', file: 'hoag.svg', width: 88, height: 36 },
  { id: 'feeding-america', name: 'Feeding America', file: 'feeding-america.svg', width: 675.68, height: 346.36 },
];

export function getPartnerGeometry(partner) {
  const crop = partner.crop ?? { x: 0, y: 0, width: partner.width, height: partner.height };
  const scale = partner.builtin===false ? Math.min(26/crop.height,120/crop.width) : 26/crop.height;
  return `--logo-width: ${crop.width * scale}px; --logo-scale: ${scale}; --logo-x: ${-crop.x}px; --logo-y: ${-crop.y}px`;
}
