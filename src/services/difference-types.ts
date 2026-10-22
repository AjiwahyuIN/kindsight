export type DifferenceItem = { id: string; title: string; description: string; icon?: string };
export type DifferenceContent = {
  label: string;
  heading: string[];
  items: DifferenceItem[];
  insight: { title: string; metrics: { id: string; label: string; value: string; icon: string }[] };
};
