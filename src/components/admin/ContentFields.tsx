import {Select} from '../ui/Select';
import { useLayoutEffect,useRef } from 'react';
import type { FieldSchema,JsonValue,JsonObject } from '../../services/content-types';
import { blankContent,schemaForItem } from '../../services/content-schema';
export function ContentFields({schema,value,path='',errors,onChange}:{schema:FieldSchema;value:JsonValue;path?:string;errors:Record<string,string>;onChange:(value:JsonValue)=>void}){
  const block=useRef<HTMLFieldSetElement>(null),focus=useRef<number|'add'|null>(null);
  useLayoutEffect(()=>{if(focus.current===null)return;const target=focus.current==='add'?block.current?.querySelector<HTMLElement>(':scope > button'):block.current?.querySelector<HTMLElement>(`[data-entry="${focus.current}"] input,[data-entry="${focus.current}"] textarea,[data-entry="${focus.current}"] [role="combobox"]`);target?.focus();focus.current=null;},[value]);
  if(schema.kind==='locked'||(schema.kind==='text'&&schema.stableId))return null;
  if(schema.kind==='text'){
    const id=`content-${path.replaceAll('.','-')}`;
    const props={id,name:path,value:typeof value==='string'?value:'',required:schema.required,'aria-invalid':errors[path]?true:undefined,'aria-describedby':`${id}-error`};
    return <div className="admin-field"><label htmlFor={id}>{schema.label}{schema.required?' *':''}</label>{schema.options?<Select {...props} onValueChange={value=>onChange(value)}><option value="">Select a logo</option>{schema.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</Select>:schema.multiline?<textarea {...props} rows={3} maxLength={schema.max} onInput={event=>onChange(event.currentTarget.value)}/>:<input {...props} type="text" maxLength={schema.max} onInput={event=>onChange(event.currentTarget.value)}/>}<p id={`${id}-error`} className="admin-field__error">{errors[path]}</p></div>;
  }
  if(schema.kind==='array'){
    const items=Array.isArray(value)?value:[];
    function move(index:number,direction:number){const next=[...items];[next[index],next[index+direction]]=[next[index+direction],next[index]];focus.current=index+direction;onChange(next);}
    return <fieldset className="content-editor__list" ref={block}><legend>{schema.label}</legend>{items.map((item,index)=>{const key=item&&typeof item==='object'&&!Array.isArray(item)&&typeof item.id==='string'?item.id:index;return <fieldset className="content-editor__entry" key={key} data-entry={index}><legend>{schema.label} {index+1}</legend><ContentFields schema={schemaForItem(schema,item,index)} value={item} path={`${path}.${index}`} errors={errors} onChange={changed=>onChange(items.map((old,i)=>i===index?changed:old))}/><div className="content-editor__row-actions">{schema.reorder!==false&&<><button type="button" className="content-editor__small" disabled={index===0} aria-label={`Move up: ${schema.label} ${index+1}`} onClick={()=>move(index,-1)}>Move up</button><button type="button" className="content-editor__small" disabled={index===items.length-1} aria-label={`Move down: ${schema.label} ${index+1}`} onClick={()=>move(index,1)}>Move down</button></>}{schema.min!==schema.max&&<button type="button" className="content-editor__small" disabled={items.length<=schema.min} aria-label={`Remove ${schema.label} ${index+1}`} onClick={()=>{focus.current='add';onChange(items.filter((_,i)=>i!==index));}}>Remove</button>}</div><p className="admin-field__error">{errors[`${path}.${index}`]}</p></fieldset>;})}<p className="admin-field__error">{errors[path]}</p>{schema.min!==schema.max&&<button type="button" className="content-editor__small" aria-label={`Add ${schema.label}`} disabled={items.length>=schema.max} onClick={()=>{focus.current=items.length;onChange([...items,blankContent(schema.item,schema.template)]);}}>Add item</button>}</fieldset>;
  }
  const object=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  return <div className="content-editor__group">{Object.entries(schema.fields).map(([key,child])=><ContentFields key={key} schema={child} value={object[key]??null} path={path?`${path}.${key}`:key} errors={errors} onChange={changed=>onChange({...object,[key]:changed} as JsonObject)}/>)}</div>;
}
