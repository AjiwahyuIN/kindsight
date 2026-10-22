import test from 'node:test';
import assert from 'node:assert/strict';
import { landingDefaults,normalizeLanding,safeContentHref,validateLanding } from '../../shared/landing-content.js';
import { navigation } from '../../src/scripts/data/navigation.js';
import { landingEndContent } from '../../src/scripts/data/landing-end.js';
import { heroContent } from '../../src/scripts/data/hero.js';
import { differenceContent } from '../../src/scripts/data/difference.js';
import { partners } from '../../src/scripts/data/partners.js';

test('legacy landing content normalizes without changing copy or link destinations',()=>{
  for(const [section,raw] of [['navbar',navigation],['footer',landingEndContent.footer],['hero',heroContent],['partners',partners],['difference',differenceContent]]){
    const normalized=normalizeLanding(section,raw);
    assert.deepEqual(validateLanding(section,normalized).fields,{});
    assert.deepEqual(normalizeLanding(section,normalized),normalized);
  }
  assert.equal(landingDefaults.footer.groups[0].links[0].href,'#solution-iwave-title');
  assert.equal(landingDefaults.navbar.groups.serve[0].label,'Nonprofits');
});
test('partner content permits catalog logos once each and rejects arbitrary files, blank names and empty lists',()=>{
  const content=structuredClone(landingDefaults.partners);
  content.items=[{logo:'unicef',name:'UNICEF accessible name'}];
  assert.deepEqual(validateLanding('partners',content).fields,{});
  content.items.push({logo:'unicef',name:' '});
  assert.ok(validateLanding('partners',content).fields['items.1.logo']);
  assert.ok(validateLanding('partners',content).fields['items.1.name']);
  content.items[0].logo='https://example.com/logo.svg';content.items[0].file='../secret';
  assert.ok(validateLanding('partners',content).fields['items.0.logo']);
  assert.ok(validateLanding('partners',content).fields['items.0.file']);
  assert.ok(validateLanding('partners',{items:[]}).fields.items);
  assert.ok(validateLanding('partners',{items:Array.from({length:21},()=>({logo:'unicef',name:'UNICEF'}))}).fields.items);
});
test('Hero schema accepts copy/slides and rejects illustration edits, empty slides and excessive copy',()=>{
  const hero=structuredClone(landingDefaults.hero);hero.connector='';hero.overview=[{title:'One slide',description:'Local introduction.'}];
  assert.deepEqual(validateLanding('hero',hero).fields,{});
  assert.equal(Object.hasOwn(normalizeLanding('hero',heroContent),'preview'),false);
  hero.preview=heroContent.preview;hero.heading='x'.repeat(121);hero.demoLabel=' ';hero.overview=[];
  const {fields}=validateLanding('hero',hero);
  for(const key of ['preview','heading','demoLabel','overview'])assert.ok(fields[key],key);
});
test('content destinations allow local anchors/paths and web URLs, reject executable or ambiguous schemes',()=>{
  for(const url of ['', '#about','/admin.html?view=donors','https://example.com/path?q=kind','http://127.0.0.1:5175/#about'])assert.equal(safeContentHref(url),true,url);
  for(const url of ['javascript:alert(1)','data:text/html,hello','//example.com','/\\example.com','https://user:pass@example.com','https://',' https://example.com','https:\n//example.com','mailto:test@example.com'])assert.equal(safeContentHref(url),false,url);
});
test('landing schema rejects unknown/missing fields, unsafe links, duplicate IDs, oversized lists and text',()=>{
  const nav=structuredClone(landingDefaults.navbar);nav.extra=true;nav.demoLabel=' ';nav.groups.serve[0].href='javascript:alert(1)';nav.groups.product[0].id=nav.groups.serve[0].id;
  const {fields}=validateLanding('navbar',nav);
  for(const key of ['extra','demoLabel','groups.serve.0.href','groups.product.0.id'])assert.ok(fields[key],key);
  const footer=structuredClone(landingDefaults.footer);footer.heading='x'.repeat(121);footer.groups.pop();
  assert.ok(validateLanding('footer',footer).fields.heading);assert.ok(validateLanding('footer',footer).fields.groups);
  assert.ok(validateLanding('navbar',null).fields.content);
});

test('difference copy preserves three known panel identities and excludes illustrative metrics/assets',()=>{
  const copy=structuredClone(landingDefaults.difference);copy.items.reverse();
  assert.deepEqual(validateLanding('difference',copy).fields,{});
  assert.equal(Object.hasOwn(copy,'insight'),false);
  assert.equal(Object.hasOwn(copy.items[2],'icon'),false);
  copy.label=' ';copy.heading.line1='x'.repeat(121);copy.items[0].id='other-panel';
  copy.items[1].description=' ';copy.insight=differenceContent.insight;
  const {fields}=validateLanding('difference',copy);
  for(const key of ['label','heading.line1','items.0.id','items.1.description','insight'])assert.ok(fields[key],key);
  const duplicate=structuredClone(landingDefaults.difference);duplicate.items[1].id=duplicate.items[0].id;
  assert.ok(validateLanding('difference',duplicate).fields['items.1.id']);
  duplicate.items.pop();assert.ok(validateLanding('difference',duplicate).fields.items);
});
