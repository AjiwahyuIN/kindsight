import { navigation } from '../src/scripts/data/navigation.js';
import { landingEndContent } from '../src/scripts/data/landing-end.js';
import { heroContent } from '../src/scripts/data/hero.js';
import { differenceContent } from '../src/scripts/data/difference.js';
import { partners } from '../src/scripts/data/partners.js';

export const landingKeys = {navbar:'navigation',footer:'footer',hero:'hero',partners:'partners',difference:'difference'};
export function safeContentHref(value) {
  if (typeof value !== 'string' || value !== value.trim() || /[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
  if (!value) return true; // Empty destination opens the existing preview.
  if (value.startsWith('#')) return /^#[A-Za-z][\w:.-]*$/.test(value);
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (!/^https?:\/\//i.test(value)) return false;
  try {const url=new URL(value);return Boolean(url.hostname)&&!url.username&&!url.password;} catch{return false;}
}
export function normalizeLanding(section,raw) {
  if(section==='difference')return {label:raw.label,heading:Array.isArray(raw.heading)?{line1:raw.heading[0],line2:raw.heading[1]}:raw.heading,items:raw.items.map(({id,title,description})=>({id,title,description}))};
  if(section==='partners')return {items:(Array.isArray(raw)?raw:raw.items).map(item=>({logo:item.logo??item.id,name:item.name}))};
  if(section==='hero')return {
    socialProof:raw.socialProof,heading:raw.heading,connector:raw.connector,highlight:raw.highlight,description:raw.description,
    demoLabel:raw.demoLabel??'Request a Demo',overviewLabel:raw.overviewLabel??'Watch Overview',
    overview:raw.overview.map(step=>({title:step.title,description:step.description})),
  };
  if(section==='navbar') return {
    brandName:raw.brandName??'Kindsight',demoLabel:raw.demoLabel??'Get a Demo',productBadge:raw.productBadge??'New',
    labels:raw.labels??{serve:'Who we Serve',product:'Product',company:'Company',resources:'Resources'},
    groups:Object.fromEntries(['serve','product','resources'].map(key=>[key,raw.groups[key].map(item=>({id:item.id,label:item.label,description:item.description,href:item.href??''}))])),
    company:{label:raw.company.label,description:raw.company.description,href:raw.company.href??''},
  };
  return {
    heading:raw.heading,description:raw.description,copyright:raw.copyright,
    groups:raw.groups.map(group=>({title:group.title,links:group.links.map(link=>typeof link==='string'?{label:link,href:raw.destinations?.[link]??''}:{label:link.label,href:link.href})})),
    legal:raw.legal.map(link=>typeof link==='string'?{label:link,href:raw.destinations?.[link]??''}:{label:link.label,href:link.href}),
  };
}
export const landingDefaults={navbar:normalizeLanding('navbar',navigation),footer:normalizeLanding('footer',landingEndContent.footer),hero:normalizeLanding('hero',heroContent),partners:normalizeLanding('partners',partners),difference:normalizeLanding('difference',differenceContent)};

// One strict schema powers both the form fields and server validation.
const text=(label,max=100,required=true)=>({type:'text',label,max,required});
const href={...text('Destination',500,false),type:'href'};
const link={label:text('Label',80),href};
export const landingSchemas={
  difference:{
    label:text('Section label',80),
    heading:{line1:text('Heading line 1',120),line2:text('Heading line 2',120)},
    items:{type:'array',label:'Accordion panels',min:3,max:3,item:{
      id:{...text('ID',60),hidden:true,values:['community','service','support']},
      title:text('Panel title',120),description:{...text('Panel description',800),multiline:true},
    }},
  },
  partners:{items:{type:'array',label:'Partner logos',min:1,max:20,item:{
    logo:{...text('Logo',60),type:'select',unique:true,options:partners.map(partner=>({value:partner.id,label:partner.name}))},
    name:text('Organization name / alt text',100),
  }}},
  hero:{
    socialProof:text('Social proof text',120),heading:text('Main heading',120),connector:text('Heading connector',30,false),highlight:text('Highlighted heading',120),
    description:{...text('Hero description',600),multiline:true},demoLabel:text('Demo button label',40),overviewLabel:text('Overview button label',40),
    overview:{type:'array',label:'Overview slides',min:1,max:6,item:{title:text('Slide title',120),description:{...text('Slide description',600),multiline:true}}},
  },
  navbar:{
    brandName:text('Brand name',30),demoLabel:text('Demo button label',40),productBadge:text('Product badge',16,false),
    labels:{serve:text('Who we serve menu label',40),product:text('Product menu label',40),company:text('Company menu label',40),resources:text('Resources menu label',40)},
    groups:Object.fromEntries(['serve','product','resources'].map(key=>[key,{type:'array',label:{serve:'Who we serve links',product:'Product links',resources:'Resource links'}[key],min:1,max:8,item:{id:{...text('ID',60),hidden:true},...link,description:{...text('Description',240,false),multiline:true}}}])),
    company:{label:text('Company preview title',80),description:{...text('Company description',240,false),multiline:true},href},
  },
  footer:{heading:text('Newsletter heading',120),description:{...text('Newsletter description',600),multiline:true},copyright:text('Copyright',100),
    groups:{type:'array',label:'Footer columns',min:3,max:3,item:{title:text('Column title',40),links:{type:'array',label:'Column links',min:1,max:10,item:link}}},
    legal:{type:'array',label:'Legal links',min:1,max:6,item:link},
  },
};
export function getLandingSchema(section,catalog=partners) {
  const schema=structuredClone(landingSchemas[section]);
  if(section==='partners')schema.items.item.logo.options=catalog.map(partner=>({value:partner.id,label:partner.name}));
  return schema;
}
export function validateLanding(section,input,catalog=partners) {
  const fields=Object.create(null),ids=new Set(['company','account']),choices=new Set();
  function walk(schema,value,path='') {
    if(schema.type==='array') {
      if(!Array.isArray(value)||value.length<schema.min||value.length>schema.max){fields[path]=`Use ${schema.min}–${schema.max} items.`;return [];}
      return value.map((item,index)=>walk(schema.item,item,`${path}.${index}`));
    }
    if(schema.type) {
      if(typeof value!=='string'){fields[path]='Enter text.';return '';}
      const clean=value.trim();
      if((schema.required&&!clean)||clean.length>schema.max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(clean))fields[path]=`Enter ${schema.required?'1':'0'}–${schema.max} characters.`;
      if(schema.type==='href'&&!safeContentHref(clean))fields[path]='Use an anchor, a local /path, or an http(s) URL without credentials.';
      if(schema.type==='select'){
        if(!schema.options.some(option=>option.value===clean))fields[path]='Select an available logo.';
        if(schema.unique&&choices.has(clean))fields[path]='Each logo can only appear once.';
        if(schema.unique)choices.add(clean);
      }
      if(schema.hidden){if(schema.values&&!schema.values.includes(clean))fields[path]='Use an existing panel ID.';if(!/^[a-z][a-z0-9-]{0,59}$/.test(clean)||ids.has(clean))fields[path]='Use a unique, stable link ID.';ids.add(clean);}
      return clean;
    }
    if(!value||Array.isArray(value)||typeof value!=='object'){fields[path||'content']='Send an object.';return {};}
    for(const key of Object.keys(value))if(!Object.hasOwn(schema,key))fields[path?`${path}.${key}`:key]='Unsupported field.';
    return Object.fromEntries(Object.entries(schema).map(([key,child])=>[key,walk(child,value[key],path?`${path}.${key}`:key)]));
  }
  const value=walk(getLandingSchema(section,catalog),input);
  return {value,fields:{...fields}};
}
