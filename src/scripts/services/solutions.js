import { solutionsContent } from '../data/solutions.js';
import platform from '../../assets/solutions/platform.svg';
import ascend from '../../assets/solutions/ascend.svg';
import iwave from '../../assets/solutions/iwave.svg';
import photo from '../../assets/solutions/fundraising-team.png';

export async function getSolutionsContent() {
  const content = structuredClone(solutionsContent);
  const icons = { platform, ascend, iwave };
  content.products = content.products.map(product => ({
    ...product,
    icon: icons[product.id],
    ...(product.image ? { image: { ...product.image, src: photo } } : {}),
  }));
  return content;
}
