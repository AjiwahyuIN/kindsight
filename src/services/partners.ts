import { getPublicContent,getLogoCatalog } from './content';
import { ServiceError, type SampleScenario, type ServiceOptions } from './types';
import type { PartnerLogo, PartnerSelection } from './partners-types';
export async function getPartners(_scenario: SampleScenario = 'success', selection: PartnerSelection = 'all', { signal }: ServiceOptions = {}): Promise<PartnerLogo[]> {
  signal?.throwIfAborted();
  
  const [content,catalog]=await Promise.all([getPublicContent('partners',{signal}),getLogoCatalog()]);
  const logos=content.items.map(item=>{const logo=catalog.find(logo=>logo.id===item.logo);if(!logo)throw new ServiceError('A saved logo is unavailable.','MISSING_LOGO',400);return {...logo,name:item.name};});
  return selection==='single'?logos.slice(0,1):logos;
}
