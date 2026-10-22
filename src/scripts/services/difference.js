import { differenceContent } from '../data/difference.js';

import { getPublicContent } from './content.js';

export async function getDifferenceContent() {
  const copy=await getPublicContent('difference');
  return {...structuredClone(differenceContent),...copy,
    heading:[copy.heading.line1,copy.heading.line2],
    items:copy.items.map(item=>({...differenceContent.items.find(original=>original.id===item.id),...item})),
  };
}
