import '../styles/pages/_admin.scss';
import '../styles/pages/_content-editor.scss';
import { landingSchemas,getLandingSchema,validateLanding } from '../../shared/landing-content.js';
import { getAdminSession,signOut } from './services/auth.js';
import { getPartnerCatalog,uploadPartnerLogo } from './services/partners.js';
import { getEditableContent,saveLandingContent } from './services/content.js';

const select=selector=>document.querySelector(selector);
const requestedSection=new URLSearchParams(location.search).get('section');
const section=Object.hasOwn(landingSchemas,requestedSection)?requestedSection:'navbar';
const title={navbar:'Navbar',footer:'Footer',hero:'Hero',partners:'Logo Partners',difference:'Kindsight Difference'}[section],schema=getLandingSchema(section);
const form=select('[data-content-form]'),fields=select('[data-content-fields]');
let catalog;
const state={saved:null,draft:null,revision:null,busy:false,dirty:false};
function authError(error){if(error.status===401){location.replace('/login.html');return true;}return false;}
function status(message){select('[data-content-status]').textContent=message;}
function error(message=''){select('[data-content-error]').textContent=message;}
function markDirty(){state.dirty=true;status('Unsaved changes.');error();}
function button(label,handler){const element=document.createElement('button');element.type='button';element.className='content-editor__small';element.textContent=label;element.addEventListener('click',handler);return element;}
function blank(definition){if(definition.type==='array')return Array.from({length:definition.min},()=>blank(definition.item));if(definition.hidden)return 'link-'+crypto.randomUUID();if(definition.type)return '';return Object.fromEntries(Object.entries(definition).map(([key,value])=>[key,blank(value)]));}
function displayErrors(messages){
  form.querySelectorAll('[aria-invalid]').forEach(element=>element.removeAttribute('aria-invalid'));
  form.querySelectorAll('[data-field-error]').forEach(element=>element.textContent='');
  let first;
  for(const [path,message] of Object.entries(messages)){
    const input=form.elements.namedItem(path);
    if(input){input.setAttribute('aria-invalid','true');first??=input;}
    const target=[...form.querySelectorAll('[data-field-error]')].find(element=>element.dataset.fieldError===path);
    if(target)target.textContent=message;
  }
  first?.focus();
}
function render(){
  fields.replaceChildren();
  function walk(definition,value,path,parent,assign){
    if(definition.hidden)return;
    if(definition.type==='array'){
      const block=document.createElement('fieldset'),legend=document.createElement('legend');block.className='content-editor__list';legend.textContent=definition.label;block.append(legend);
      value.forEach((item,index)=>{
        const entry=document.createElement('fieldset'),entryTitle=document.createElement('legend'),controls=document.createElement('div');entry.className='content-editor__entry';entryTitle.textContent=`${definition.label} ${index+1}`;entry.append(entryTitle);
        walk(definition.item,item,`${path}.${index}`,entry,next=>value[index]=next);
        controls.className='content-editor__row-actions';
        for(const [label,offset] of [['Move up',-1],['Move down',1]]){
          const move=button(label,()=>{[value[index],value[index+offset]]=[value[index+offset],value[index]];markDirty();render();fields.querySelector(`[name="${path}.${index+offset}.${Object.keys(definition.item).find(key=>!definition.item[key].hidden)}"]`)?.focus();});
          move.disabled=index+offset<0||index+offset>=value.length;move.setAttribute('aria-label',`${label}: ${definition.label} ${index+1}`);controls.append(move);
        }
        if(definition.min!==definition.max){const remove=button('Remove',()=>{value.splice(index,1);markDirty();render();fields.querySelector(`[data-array-add="${path}"]`)?.focus();});remove.disabled=value.length<=definition.min;remove.setAttribute('aria-label',`Remove ${definition.label} ${index+1}`);controls.append(remove);}
        entry.append(controls);block.append(entry);
      });
      const feedback=document.createElement('p');feedback.className='admin-field__error';feedback.dataset.fieldError=path;block.append(feedback);
      if(definition.min!==definition.max){const add=button('Add item',()=>{value.push(blank(definition.item));markDirty();render();const firstKey=Object.keys(definition.item).find(key=>!definition.item[key].hidden);fields.querySelector(`[name="${path}.${value.length-1}.${firstKey}"]`)?.focus();});add.dataset.arrayAdd=path;add.setAttribute('aria-label',`Add ${definition.label}`);add.disabled=value.length>=definition.max;block.append(add);}
      parent.append(block);return;
    }
    if(definition.type){
      const wrapper=document.createElement('div'),label=document.createElement('label'),input=document.createElement(definition.type==='select'?'select':definition.multiline?'textarea':'input'),feedback=document.createElement('p');
      if(definition.type==='select')for(const choice of [{value:'',label:'Select a logo'},...definition.options]){const option=document.createElement('option');option.value=choice.value;option.textContent=choice.label;input.append(option);}
      wrapper.className='admin-field';input.id='content-'+path.replaceAll('.','-');input.name=path;input.value=value;input.required=Boolean(definition.required);
      if(definition.type!=='select'){input.maxLength=definition.max;if(!definition.multiline)input.type='text';else input.rows=3;}
      label.htmlFor=input.id;label.textContent=definition.label;feedback.id=input.id+'-error';feedback.className='admin-field__error';feedback.dataset.fieldError=path;input.setAttribute('aria-describedby',feedback.id);
      input.addEventListener('input',()=>{assign(input.value);input.removeAttribute('aria-invalid');feedback.textContent='';markDirty();});
      wrapper.append(label,input,feedback);parent.append(wrapper);return;
    }
    const group=document.createElement('div');group.className='content-editor__group';
    for(const [key,child] of Object.entries(definition))walk(child,value[key],path?`${path}.${key}`:key,group,next=>value[key]=next);
    parent.append(group);
  }
  walk(schema,state.draft,'',fields,()=>{});
}
function busy(value){state.busy=value;select('[data-logo-upload-button]').disabled=value||!catalog;fields.disabled=value;for(const key of ['save','reset','reload'])select(`[data-content-${key}]`).disabled=value;}
async function load(){
  if(state.busy)return;busy(true);error();status('Loading saved content…');
  try {
    const [response,logos]=await Promise.all([getEditableContent(section),section==='partners'?getPartnerCatalog():null]);
    if(logos){catalog=logos;schema.items.item.logo.options=getLandingSchema(section,logos).items.item.logo.options;}
    state.saved=response.data;state.draft=structuredClone(response.data);state.revision=response.meta.revision;state.dirty=false;render();form.hidden=false;status('Saved content loaded.');}
  catch(cause){if(!authError(cause)){error(cause.message);status('');}}
  finally{busy(false);}
}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(state.busy)return;
  const checked=validateLanding(section,state.draft,catalog);displayErrors(checked.fields);
  if(Object.keys(checked.fields).length){error('Please correct the highlighted fields.');return;}
  busy(true);error();status('Saving…');
  try{const response=await saveLandingContent(section,checked.value,state.revision);state.saved=response.data;state.draft=structuredClone(response.data);state.revision=response.meta.revision;state.dirty=false;render();status('Saved and published. Refresh the landing page to see the changes.');}
  catch(cause){if(!authError(cause)){error(cause.message);if(cause.fields)displayErrors(cause.fields);status('Your unsaved changes are still in this editor.');}}
  finally{busy(false);}
});
select('[data-content-reset]').addEventListener('click',()=>{if(state.saved){state.draft=structuredClone(state.saved);state.dirty=false;render();error();status('Unsaved changes reset.');}});
select('[data-content-reload]').addEventListener('click',load);
window.addEventListener('beforeunload',event=>{if(state.dirty){event.preventDefault();event.returnValue='';}});
select('[data-content-logout]').addEventListener('click',async()=>{try{await signOut();state.dirty=false;location.replace('/login.html');}catch(cause){error(cause.message);}});
select('[data-content-title]').textContent=title;
if(section==='difference'){
  select('[data-content-help]').textContent='Save to publish the section heading and accordion copy.';
  select('[data-content-note]').textContent='Edit the label, two heading lines, and titles/descriptions of the three panels. Move panels up or down to change their order; the first panel opens by default. Icons and the Insight illustration remain fixed sample content, not live fundraising figures.';
}
if(section==='hero'){
  select('[data-content-help]').textContent='Save to publish Hero text and Overview slides.';
  select('[data-content-note]').textContent='Edit the heading, description, social proof and button labels. Overview supports 1–6 slides. The dashboard illustration uses fixed sample figures; demo requests are currently local previews.';
}
if(section==='partners'){
  select('[data-content-help]').textContent='Save to publish the names and order of partner logos.';
  select('[data-content-note]').textContent='Choose 1–20 logos from the local asset library, including your uploads. Each logo can appear once. Organization names are used as accessible image descriptions. Upload first, add an item or choose a logo below, then save to publish.';
}
const uploadForm=select('[data-logo-upload]');
if(section==='partners')uploadForm.hidden=false;
uploadForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=select('[data-logo-upload-button]'),message=select('[data-logo-upload-status]'),failure=select('[data-logo-upload-error]');
  if(button.disabled||state.busy||!catalog)return;
  const file=uploadForm.elements.logo.files[0];failure.textContent='';
  if(!file||file.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){
    failure.textContent='Choose a PNG, JPG or WebP image up to 2 MB.';uploadForm.elements.logo.focus();return;
  }
  button.disabled=true;busy(true);message.textContent='Uploading…';
  try {
    const logo=await uploadPartnerLogo(uploadForm.elements.name.value.trim(),file);
    catalog.push(logo);schema.items.item.logo.options=getLandingSchema(section,catalog).items.item.logo.options;
    if(state.draft)render();
    const preview=select('[data-logo-upload-preview]');preview.src=logo.src;preview.alt=logo.name;preview.hidden=false;
    uploadForm.reset();message.textContent=`${logo.name} uploaded. Choose it in the logo list below, then Save and publish.`;
  }catch(cause){message.textContent='';if(!authError(cause))failure.textContent=cause.message;}
  finally{button.disabled=false;busy(false);}
});
select(`[data-section-tab="${section}"]`).setAttribute('aria-current','page');
try {
  const {admin}=await getAdminSession();select('[data-content-user]').textContent=admin.name;
  select('[data-content-account]').hidden=false;select('[data-content-workspace]').hidden=false;select('[data-content-gate]').hidden=true;await load();
}catch(cause){if(!authError(cause)){select('[data-content-gate]').textContent=cause.message;}}
