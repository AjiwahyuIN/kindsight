import { apiRequest } from './api.js';
import { getPublicContent } from './content.js';
import nature from '../../assets/partners/nature-conservancy.svg';
import smithsonian from '../../assets/partners/smithsonian-channel.svg';
import unicef from '../../assets/partners/unicef.svg';
import hoag from '../../assets/partners/hoag.svg';
import feeding from '../../assets/partners/feeding-america.svg';

const images = {
  'nature-conservancy': nature,
  'smithsonian-channel': smithsonian,
  unicef,
  hoag,
  'feeding-america': feeding,
};

export async function getPartners() {
  const [{items},catalog]=await Promise.all([getPublicContent('partners'),getPartnerCatalog()]);
  return items.map(item=>{
    const partner=catalog.find(partner=>partner.id===item.logo);
    if(!partner)throw new Error('Unknown partner logo.');
    return {...structuredClone(partner),name:item.name,src:images[partner.id]??partner.src};
  });
}

export async function getPartnerCatalog(){return (await apiRequest('partner-logos')).data;}
export async function uploadPartnerLogo(name,file){
  const body=new FormData();body.append('name',name);body.append('logo',file);
  return (await apiRequest('admin/partner-logos',{method:'POST',body})).data;
}
