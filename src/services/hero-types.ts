export type HeroContent = {
  socialProof: string; heading: string; connector: string; highlight: string; description: string;
  demoLabel: string; overviewLabel: string;
  overview: { title: string; description: string }[];
};
// Static design illustration, deliberately separate from report/API data.
export type HeroIllustration = {
  raised: string; cents: string; growth: string; majorGifts: string; forecasted: string; pending: string; insights: string;
  bars: number[];
  prospects: { name: string; capacity: string; gift: string; engagement: string; status: string; image: 'prospect-1' | 'prospect-2' }[];
};
