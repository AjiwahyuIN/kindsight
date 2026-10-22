export type FooterLink = { label: string; href: string };
export type FooterContent = {
  heading: string; description: string; copyright: string;
  groups: { title: string; links: FooterLink[] }[];
  legal: FooterLink[];
};
export type NewsletterScenario = 'success' | 'error';
export type NewsletterPreview = { message: string; subscribed: false };
