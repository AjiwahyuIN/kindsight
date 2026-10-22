export type NavigationGroup = 'serve' | 'product' | 'resources';
export type NavigationItem = { id: string; label: string; description: string; href: string };
export type NavigationContent = {
  brandName: string; demoLabel: string; productBadge: string;
  labels: Record<NavigationGroup | 'company', string>;
  groups: Record<NavigationGroup, NavigationItem[]>;
  company: NavigationItem;
};
export type SampleAccount = { name: string; email: string };
export type AccountScenario = 'guest' | 'admin' | 'error';
