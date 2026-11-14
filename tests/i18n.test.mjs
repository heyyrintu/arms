import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createTranslator,localizeContent,normalizeLanguage} from '../lib/i18n-core.mjs';
const messages=JSON.parse(await readFile(new URL('../content/hi.json',import.meta.url),'utf8'));
const t=createTranslator(messages);
test('locale is allowlisted and UI messages cover the four industries and critical gates',()=>{
  for(const input of [undefined,'en','fr','HI','<script>'])assert.equal(normalizeLanguage(input),'en');
  assert.equal(normalizeLanguage('hi'),'hi');
  for(const key of ['Career','Gig Work','Warehousing & Fulfillment','Transportation & Drivers','Cafés & Hospitality','Submissions are not open yet.','Staff sign-in','Publish job','Draft for review — submissions remain disabled.'])assert.match(t(key,'hi'),/[\u0900-\u097f]/);
  assert.ok(Object.keys(messages).length>600);
  assert.equal(t('Career','en'),'Career');assert.equal(t('authored source text','hi'),'authored source text');
  assert.equal(t('constructor','hi'),'constructor');assert.equal(t('__proto__','hi'),'__proto__');
});
test('localization preserves control values, handlers, IDs, links and source content',()=>{
  const onChange=()=>{};
  const input=createElement('input',{id:'payrollModel',name:'payrollModel',value:'Client-managed payroll',placeholder:'Company name',onChange});
  const localized=localizeContent(input,'hi',t);
  assert.equal(localized.props.value,input.props.value);assert.equal(localized.props.onChange,onChange);assert.equal(localized.props.name,'payrollModel');assert.equal(localized.props.id,'payrollModel');assert.equal(localized.props.placeholder,'कंपनी का नाम');
  const option=localizeContent(createElement('option',null,'Contract'),'hi',t);assert.equal(option.props.value,'Contract');assert.equal(option.props.children,'अनुबंध आधारित');
  const explicit=localizeContent(createElement('option',{value:'arms'},'ARMS-managed payroll'),'hi',t);assert.equal(explicit.props.value,'arms');
  const source=createElement('span',{'data-original':true},'Contract');assert.equal(localizeContent(source,'hi',t),source);
  const link=localizeContent(createElement('a',{href:'/jobs?industry=gig-work'},'Find Jobs'),'hi',t);assert.equal(link.props.href,'/jobs?industry=gig-work');
  const keyed=createElement('span',{key:'stable-job-filter'},'Industry');
  assert.equal(localizeContent([null,[keyed]],'hi',t)[1][0].key,'stable-job-filter');
  const siblings=[createElement('span',null,'Industry'),null,createElement('span',null,'Career')];
  assert.deepEqual(localizeContent(siblings,'en',t).map(node=>node?.key),localizeContent(siblings,'hi',t).map(node=>node?.key));
});
test('Hindi renders as actual server HTML with escaped values and translated accessible labels',()=>{
  const node=createElement('section',{'aria-label':'Job search'},createElement('h1',null,'Build your career.'),createElement('span',{'data-original':true},'<img src=x onerror=alert(1)>'));
  const output=renderToStaticMarkup(localizeContent(node,'hi',t));assert.match(output,/अपना करियर बनाएँ/);assert.match(output,/aria-label="नौकरी की खोज"/);assert.match(output,/&lt;img/);assert.doesNotMatch(output,/<img/);
  assert.equal(t('Saved revision 12','hi'),'सहेजा संशोधन 12');assert.equal(t('Use 120 characters or fewer.','hi'),'अधिकतम 120 अक्षर लिखें।');
});
