import { getContentSchema,schemaForItem } from './content-schema';
import type { ContentSection,FieldSchema,JsonValue,JsonObject } from './content-types';
// Assets and geometry belong to the approved bundled design, never database URLs.
export function contentToWire(section:ContentSection,value:JsonObject):JsonObject{
 function walk(s:FieldSchema,v:JsonValue):JsonValue{if(s.kind==='object')return Object.fromEntries(Object.entries(s.fields).filter(([,c])=>c.kind!=='locked').map(([k,c])=>[k,walk(c,(v as JsonObject)[k])]));if(s.kind==='array')return(v as JsonValue[]).map((entry,i)=>walk(schemaForItem(s,entry,i),entry));return v;}
 return walk(getContentSchema(section),value) as JsonObject;
}
export function contentFromWire(section:ContentSection,value:JsonObject):JsonObject{
 function walk(s:FieldSchema,v:JsonValue|undefined):JsonValue{if(s.kind==='locked')return structuredClone(s.value??null);if(s.kind==='object')return Object.fromEntries(Object.entries(s.fields).map(([k,c])=>[k,walk(c,(v as JsonObject|undefined)?.[k])]));if(s.kind==='array')return(v as JsonValue[]).map((entry,i)=>walk(schemaForItem(s,entry,i),entry));return v!;}
 return walk(getContentSchema(section),value) as JsonObject;
}
