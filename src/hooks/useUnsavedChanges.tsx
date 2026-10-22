import { useEffect,useLayoutEffect,useRef } from 'react';
import { useBlocker } from 'react-router';
import { Dialog } from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
export function UnsavedChanges({dirty,title='Discard unsaved changes?',description='Your changes have not been saved. Stay to continue editing, or discard them and leave.'}:{dirty:boolean;title?:string;description?:string}){
  const blocker=useBlocker(dirty),trigger=useRef<HTMLElement>(null),keep=useRef<HTMLButtonElement>(null);
  useLayoutEffect(()=>{if(blocker.state==='blocked'&&document.activeElement instanceof HTMLElement)trigger.current=document.activeElement;},[blocker.state]);
  useEffect(()=>{if(!dirty)return;const before=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',before);return()=>window.removeEventListener('beforeunload',before);},[dirty]);
  return <Dialog className="admin-confirm" open={blocker.state==='blocked'} onClose={()=>{if(blocker.state==='blocked')blocker.reset();}} initialFocus={keep} returnFocus={trigger} aria-labelledby="discard-title" aria-describedby="discard-description"><h2 id="discard-title">{title}</h2><p id="discard-description">{description}</p><div className="admin-editor__actions"><Button variant="outline" size="sm" ref={keep} onClick={()=>{if(blocker.state==='blocked')blocker.reset();}}>Keep editing</Button><Button variant="dark" size="sm" onClick={()=>{if(blocker.state==='blocked')blocker.proceed();}}>Discard and leave</Button></div></Dialog>;
}
