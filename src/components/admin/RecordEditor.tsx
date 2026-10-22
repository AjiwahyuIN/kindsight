import {Select} from '../ui/Select';
import {UnsavedChanges} from '../../hooks/useUnsavedChanges';
import { useRef,useState,type RefObject,type FormEvent } from 'react';
import { adminEntities } from '../../data/admin';
import type { Entity,ManagedRecord,RecordDraft } from '../../services/fundraising-types';
import { useRecordMutation,useReferences } from '../../queries/fundraising';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ServiceError } from '../../services/types';
function localDateTime(iso:string){if(!iso)return '';const date=new Date(iso);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,19);}
function initialDraft(entity:Entity,current:ManagedRecord|null):RecordDraft{
  return Object.fromEntries(adminEntities[entity].fields.map(field=>{
    let value=current&&field.name in current?String(current[field.name as keyof typeof current]??''):field.name==='status'?(entity==='donations'?'pending':'draft'):'';
    if(field.type==='datetime-local')value=localDateTime(value);return[field.name,value];
  }));
}
export function RecordEditor({entity,current,returnFocus,onClose,onSaved}:{entity:Entity;current:ManagedRecord|null;returnFocus:RefObject<HTMLElement|null>;onClose:()=>void;onSaved:()=>void}){
  const [initial]=useState(()=>initialDraft(entity,current));
  const [draft,setDraft]=useState(initial);
  const dirty=JSON.stringify(draft)!==JSON.stringify(initial);
  const mutation=useRecordMutation(),references=useReferences(entity==='donations');
  const close=useRef<HTMLButtonElement>(null),form=useRef<HTMLFormElement>(null);
  const errors=mutation.error instanceof ServiceError?mutation.error.fields??{}:{};
  async function save(event:FormEvent){event.preventDefault();if(mutation.isPending)return;const value={...draft};
    for(const field of adminEntities[entity].fields)if(field.type==='datetime-local'&&value[field.name]){const date=new Date(value[field.name]);if(!Number.isNaN(date.getTime()))value[field.name]=date.toISOString();}
    try{await mutation.mutateAsync({entity,id:current?.id,revision:current?.revision,draft:value});onSaved();}catch(error){if(error instanceof ServiceError&&error.fields){const first=Object.keys(error.fields)[0];form.current?.querySelector<HTMLElement>(`[data-field-name="${first}"],[name="${first}"]:not(select)`)?.focus();}}
  }
  return <><Dialog className="admin-editor" lang="en" open onClose={onClose} initialFocus={close} returnFocus={returnFocus} aria-labelledby="record-editor-title"><form ref={form} onSubmit={event=>void save(event)} aria-busy={mutation.isPending}><div className="admin-editor__header"><h2 id="record-editor-title">{current?'Edit':'Add'} {adminEntities[entity].singular}</h2><Button ref={close} variant="light" size="sm" disabled={mutation.isPending} onClick={onClose}>Close</Button></div><p className="admin-editor__note">Required fields are marked *.{entity!=='donors'&&' Amounts are recorded in USD.'}{entity==='donations'&&' Date/time inputs use your local time and are saved in UTC.'}</p><fieldset className="admin-editor__fields admin-editor__fieldset" disabled={mutation.isPending}>
    {adminEntities[entity].fields.map(field=>{const id=`record-${field.name}`,feedback=errors[field.name];const historicalId=current?.kind==='donations'?(field.name==='donor_id'?current.donor_id:field.name==='campaign_id'?current.campaign_id:''):'';const attrs={id,name:field.name,value:draft[field.name]??'',required:field.required,'aria-invalid':feedback?true:undefined,'aria-describedby':`${id}-error`};
      return <div className="admin-field" key={field.name}><label htmlFor={id}>{field.label}{field.required&&<span className="admin-field__required" aria-hidden="true"> *</span>}</label>{field.type==='textarea'?<textarea {...attrs} rows={3} maxLength={field.max} onInput={event=>{const text=event.currentTarget.value;setDraft(value=>({...value,[field.name]:text}));}}/>:field.type==='select'||field.type==='reference'?<Select {...attrs} disabled={mutation.isPending||(field.type==='reference'&&!references.data)} onValueChange={nextValue=>{const value=nextValue;setDraft(draft=>({...draft,[field.name]:value}));}}>{field.type==='reference'?<><option value="">{field.empty}</option>{references.data?.[field.source!].filter(row=>!row.archived||row.id===historicalId).map(row=><option value={row.id} key={row.id}>{row.name}{row.archived?' (archived/current)':''}</option>)}</>:field.choices?.map(value=><option key={value} value={value}>{value.charAt(0).toUpperCase()+value.slice(1)}</option>)}</Select>:<input {...attrs} type={field.type??'text'} maxLength={field.max} inputMode={field.money?'decimal':undefined} pattern={field.money?'(0|[1-9][0-9]{0,12})([.][0-9]{1,2})?':undefined} placeholder={field.money?'0.00':undefined} step={field.type==='datetime-local'?1:undefined} onInput={event=>{const text=event.currentTarget.value;setDraft(value=>({...value,[field.name]:text}));}}/>}<p id={`${id}-error`} className="admin-field__error">{feedback}</p></div>;
    })}</fieldset>{entity==='donations'&&references.isError&&<p role="alert">{references.error.message} <Button size="sm" variant="outline" onClick={()=>void references.refetch()}>Retry choices</Button></p>}{mutation.isError&&<p className="admin-editor__feedback" role="alert">{mutation.error.message}</p>}<div className="admin-editor__actions"><Button size="sm" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button><Button size="sm" type="submit" disabled={mutation.isPending||(entity==='donations'&&!references.data)}>{mutation.isPending?'Saving…':'Save'}</Button></div></form></Dialog><UnsavedChanges dirty={dirty&&!mutation.isPending}/></>;
}
