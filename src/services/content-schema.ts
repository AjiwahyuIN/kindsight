import { contentDefaults } from '../data/content';
import type { ContentSection, FieldSchema, JsonValue, JsonObject } from './content-types';
import type { PartnerLogo } from './partners-types';
const label = (name: string) => name.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/^./,value => value.toUpperCase());
export function safeHref(value: string) {
  if (!value) return true;
  if (/[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith('#')) return /^#[A-Za-z][\w:.-]*$/.test(value);
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (!/^https?:\/\//i.test(value)) return false;
  try { const url = new URL(value); return Boolean(url.hostname) && !url.username && !url.password; } catch { return false; }
}
export function getContentSchema(section: ContentSection, catalog: PartnerLogo[] = []): FieldSchema {
  function walk(value: JsonValue, path: string): FieldSchema {
    const key = path.split('.').at(-1) ?? '';
    if (section === 'difference' && path === 'insight') return {kind:'locked',value};
    if (['src','icon','image','featured'].includes(key) && (typeof value !== 'object' || key !== 'image')) return {kind:'locked',value};
    if (typeof value === 'string') {
      if (key === 'id') return {kind:'text',label:'Stable ID',max:60,required:true,stableId:true};
      if (section === 'partners' && key === 'logo') return {kind:'text',label:'Logo',max:100,required:true,options:catalog.map(logo=>({value:logo.id,label:logo.name}))};
      const long = /description|quote|introduction|emphasis|note|tagline/i.test(key);
      return {kind:'text',label:label(key || 'Text'),max:long?2000:/href/i.test(key)?500:160,required:!['href','connector','productBadge','suffix'].includes(key),multiline:long,href:key==='href'};
    }
    if (Array.isArray(value)) {
      let min=value.length,max=value.length,reorder=true;
      if (section==='navbar' && path.startsWith('groups.')) {min=1;max=8;}
      if (section==='footer' && path.endsWith('.links')) {min=1;max=10;}
      if (section==='footer' && path==='legal') {min=1;max=6;}
      if (section==='hero' && path==='overview') {min=1;max=6;}
      if (section==='partners') {min=1;max=20;}
      if (section==='testimonials' && path==='stories') {min=1;max=6;}
      if ((section==='solutions' && path==='products') || (section==='sectors' && path==='cards') || (section==='about' && path==='statistics')) reorder=false;
      const item=walk(value[0],`${path}.*`);
      const variants=min===max && value.every(entry=>entry && typeof entry==='object' && !Array.isArray(entry) && typeof entry.id==='string') ? Object.fromEntries(value.map(entry=>[(entry as JsonObject).id as string,walk(entry,`${path}.*`)])) : undefined;
      if(section==='missions'&&path==='benefits')reorder=false;
      const indexed=min===max&&!variants?value.map(entry=>walk(entry,`${path}.*`)):undefined;
      const arrayLabel=section==='partners'&&path==='items'?'Partner logos':section==='difference'&&path==='items'?'Accordion panels':section==='hero'&&path==='overview'?'Overview slides':section==='footer'&&path==='groups'?'Footer columns':label(key);
      return {kind:'array',label:arrayLabel,min,max,item,reorder,variants,indexed,template:structuredClone(value[0])};
    }
    if (value && typeof value==='object') return {kind:'object',fields:Object.fromEntries(Object.entries(value).map(([key,child])=>[key,walk(child,path?`${path}.${key}`:key)]))};
    return {kind:'locked',value};
  }
  return walk(JSON.parse(JSON.stringify(contentDefaults[section])) as JsonObject,'');
}
export function schemaForItem(schema: Extract<FieldSchema,{kind:'array'}>, value: JsonValue, index=0) {
  const id=value && typeof value==='object' && !Array.isArray(value) ? value.id : null;
  return typeof id==='string' && schema.variants?.[id] ? schema.variants[id] : schema.indexed?.[index] ?? schema.item;
}
export function blankContent(schema: FieldSchema, template?: JsonValue): JsonValue {
  if(schema.kind==='locked')return structuredClone(schema.value ?? null);
  if(schema.kind==='text')return schema.stableId?`item-${crypto.randomUUID()}`:'';
  if(schema.kind==='array')return Array.from({length:schema.min},()=>blankContent(schema.item,schema.template));
  const object=template && typeof template==='object' && !Array.isArray(template)?template:{};
  return Object.fromEntries(Object.entries(schema.fields).map(([key,child])=>[key,blankContent(child,object[key])]));
}
export function validateContent(section: ContentSection, input: JsonObject, catalog: PartnerLogo[]) {
  const errors:Record<string,string>={},ids=new Set<string>(),logos=new Set<string>();
  function walk(schema:FieldSchema,value:JsonValue|undefined,path:string):JsonValue {
    if(schema.kind==='locked') { if(JSON.stringify(value)!==JSON.stringify(schema.value))errors[path]='This design field is fixed.';return structuredClone(schema.value??null); }
    if(schema.kind==='text') {
      if(typeof value!=='string'){errors[path]='Enter text.';return '';}
      const clean=value.trim();
      if((schema.required&&!clean)||clean.length>schema.max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean))errors[path]=`Enter ${schema.required?'1':'0'}–${schema.max} characters.`;
      if(schema.href&&!safeHref(clean))errors[path]='Use an anchor, local /path or http(s) URL without credentials.';
      if(schema.options){if(!schema.options.some(option=>option.value===clean))errors[path]='Choose an available logo.';if(logos.has(clean))errors[path]='Each logo can appear once.';logos.add(clean);}
      if(schema.stableId){if(!/^[a-z][a-z0-9-]{0,59}$/.test(clean)||ids.has(clean))errors[path]='Use a unique stable ID.';ids.add(clean);}
      return clean;
    }
    if(schema.kind==='array') {
      if(!Array.isArray(value)||value.length<schema.min||value.length>schema.max){errors[path]=`Use ${schema.min}–${schema.max} items.`;return [];}
      return value.map((entry,index)=>{
        if(schema.variants && (!entry||typeof entry!=='object'||Array.isArray(entry)||typeof entry.id!=='string'||!schema.variants[entry.id]))errors[`${path}.${index}`]='Use the existing design items.';
        if(schema.reorder===false&&schema.variants&&entry&&typeof entry==='object'&&!Array.isArray(entry)&&entry.id!==Object.keys(schema.variants)[index])errors[`${path}.${index}`]='Keep the approved design order.';
        return walk(schemaForItem(schema,entry,index),entry,`${path}.${index}`);
      });
    }
    if(!value||typeof value!=='object'||Array.isArray(value)){errors[path]='Send an object.';return {};}
    for(const key of Object.keys(value))if(!Object.hasOwn(schema.fields,key))errors[path?`${path}.${key}`:key]='Unsupported field.';
    return Object.fromEntries(Object.entries(schema.fields).map(([key,child])=>[key,walk(child,value[key],path?`${path}.${key}`:key)]));
  }
  return {content:walk(getContentSchema(section,catalog),input,'') as JsonObject,errors};
}
