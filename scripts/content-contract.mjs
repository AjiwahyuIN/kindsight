// Refresh only when approved editable design fields change. No database writes.
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]}});
try {
 const {contentDefaults}=await vite.ssrLoadModule('/src/data/content.ts');
 const {getContentSchema}=await vite.ssrLoadModule('/src/services/content-schema.ts');
 function editable(schema){if(schema.kind==='locked')return null;if(schema.kind==='object')return {...schema,fields:Object.fromEntries(Object.entries(schema.fields).flatMap(([k,s])=>{const child=editable(s);return child?[[k,child]]:[];}))};if(schema.kind==='array')return {...schema,item:editable(schema.item),template:undefined,variants:schema.variants&&Object.fromEntries(Object.entries(schema.variants).map(([k,s])=>[k,editable(s)])),indexed:schema.indexed?.map(editable)};return schema;}
 function pick(schema,value){if(schema.kind==='object')return Object.fromEntries(Object.entries(schema.fields).map(([k,s])=>[k,pick(s,value[k])]));if(schema.kind==='array')return value.map((v,i)=>pick(schema.variants?.[v.id]??schema.indexed?.[i]??schema.item,v));return value;}
 const contract=Object.fromEntries(Object.entries(contentDefaults).map(([section,data])=>{const schema=editable(getContentSchema(section));return[section,{schema,defaults:pick(schema,data)}];}));
 await writeFile(new URL('../shared/react-content.json',import.meta.url),JSON.stringify(contract,null,2)+'\n');
 console.log('Editable CMS contract generated; design assets remain bundled with React.');
}finally{await vite.close();}
