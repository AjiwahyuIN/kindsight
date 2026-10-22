export type AboutContent = { label: string; heading: string[]; description: string; statistics: { id: string; value: string; suffix: string; label: string }[] };
export type SolutionProduct = { id: string; featured?: boolean; title: string; description: string; icon: string; cta?: string; image?: { src: string; alt: string; badge: { value: string; label: string; detail: string } } };
export type SolutionsContent = { label: string; heading: string[]; description: string; products: SolutionProduct[]; overview: { title: string; description: string; note: string; topics: { title: string; description: string }[] } };
export type TestimonialStory = { id: string; name: string; rating: string; period: string; quote: string; tagline: string; image: string; imageAlt: string };
export type TestimonialsContent = { heading: string; introduction: string; stories: TestimonialStory[] };
export type MissionsContent = { label: string; heading: string; introduction: string; emphasis: string; benefits: { icon: string; description: string }[]; donors: string; donorLabel: string; growth: string; growthLabel: string };
export type SectorCard = { id: string; title: string; image: string; icon?: string; description: string };
export type SectorsContent = { label: string; heading: string; emphasis: string; description: string; donation: string; volunteers: string; percentage: string; cards: SectorCard[] };
