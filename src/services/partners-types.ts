export type PartnerLogo = {
  id: string; name: string; src: string; width: number; height: number;
  crop?: { x: number; y: number; width: number; height: number };
  builtin: boolean;
};
export type PartnerSelection = 'all' | 'single';
