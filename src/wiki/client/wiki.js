import { prepare, search, normalize } from './search.mjs';
import { readState, stateUrl, paginate, rangeText } from './browse-state.mjs';
const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const locale=document.body.dataset.locale;
function languageQueries() {
  const q=new URL(location.href).searchParams.get('q');
  for(const link of all('.languages a')) { const url=new URL(link.href); if(q)url.searchParams.set('q',q);else url.searchParams.delete('q');link.href=url.pathname+url.search; }
}
function writeState(base,state,mode) {
  const url=stateUrl(location.href,base,state);
  if(url!==location.pathname+location.search+location.hash)history[mode==='push'?'pushState':'replaceState'](null,'',url);
  languageQueries();
}
function showPager(page) {
  for(const nav of all('[data-filter-pagination]')) {
    nav.hidden=page.pages<=1;
    nav.querySelector('[data-filter-page]').textContent=`${page.page} / ${page.pages}`;
    nav.querySelector('[data-filter-previous]').disabled=page.page===1;
    nav.querySelector('[data-filter-next]').disabled=page.page===page.pages;
  }
}
function focusResults(element) { element.focus({preventScroll:true});element.scrollIntoView({block:'start'}); }
function wirePager(change) {
  for(const button of all('[data-filter-previous]'))button.addEventListener('click',()=>change(-1));
  for(const button of all('[data-filter-next]'))button.addEventListener('click',()=>change(1));
}
languageQueries();
const status = $('[data-search-status]');
if (status) {
  try {
    let documents;
    const response=await fetch(document.body.dataset.index);if(!response.ok)throw new Error(response.status);
    documents=prepare(await response.json());
    const container=$('[data-search-results]');let state;
    function update(mode='replace',focus=false) {
      state=readState(location.href);$('#global-search').value=state.q;
      const page=paginate(search(documents,state.q),state.page);state.page=page.page;
      container.replaceChildren();
      status.textContent=!state.q.trim()?'':page.total?`${status.dataset.results}: ${page.total} · ${rangeText(status.dataset.range,page,locale)}`:status.dataset.empty;
      for(const [kind,rows] of Map.groupBy(page.rows,doc=>doc.kind)) {
        const heading=document.createElement('h2');heading.textContent=rows[0].kindLabel??kind;
        const list=document.createElement('ul');list.className='search-results';
        for(const doc of rows) {
          const li=document.createElement('li'),link=document.createElement('a'),description=document.createElement('p');
          link.href=doc.url;link.textContent=doc.name;description.textContent=doc.description;li.append(link,description);list.append(li);
        }
        container.append(heading,list);
      }
      showPager(page);writeState(location.pathname,state,mode);if(focus)focusResults(container);
    }
    wirePager(delta=>{state.page+=delta;writeState(location.pathname,state,'push');update('replace',true);});
    addEventListener('popstate',()=>update());update();
  } catch { status.textContent=status.dataset.error; }
}
const list = $('[data-entity-list]');
if(list) {
  try {
    const response=await fetch(list.dataset.listIndex);if(!response.ok)throw new Error(response.status);
    const rows=await response.json(),type=$('[data-type-filter]'),facets=all('[data-facet]'),sort=$('[data-sort]');
    const query=$('[data-list-query]'),minimum=$('[data-min-level]'),counter=$('[data-list-count]');
    const base=list.dataset.baseUrl||location.pathname.replace(/page\/\d+\/$/,'');
    const controls={q:query,type,minLevel:minimum,sort,...Object.fromEntries(facets.map(s=>[s.dataset.facet,s]))};
    function appendOptions(select,values) { for(const value of values){const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);} }
    for(const select of facets) {
      const values=[...new Set(rows.flatMap(row=>row.facets[select.dataset.facet]??[]))].sort((a,b)=>a.localeCompare(b,locale,{numeric:true}));
      select.closest('label').hidden=values.length<2;appendOptions(select,values);
    }
    const types=[...new Set(rows.map(r=>r.type))];$('[data-type-label]').hidden=types.length<2;appendOptions(type,types);
    const hasLevel=rows.some(r=>r.level>0);$('[data-level-label]').hidden=!hasLevel;sort.querySelector('[value="level"]').hidden=!hasLevel;
    const levelLabel=$('[data-level-label]').firstChild.textContent.replace('≥','').trim();
    let state;
    function restore() {
      state=readState(location.href);
      for(const [key,control] of Object.entries(controls)) {
        control.value=String(state[key]);
        if(control.tagName==='SELECT'&&control.value!==String(state[key]))control.value=key==='sort'?'default':'';
        state[key]=key==='minLevel'?Number(control.value):control.value;
      }
    }
    function createRow(row) {
      const li=document.createElement('li'),a=document.createElement('a'),img=document.createElement('img');a.href=row.url;
      Object.assign(img,{src:row.image,alt:'',width:32,height:32,loading:'lazy'});
      const name=document.createElement('span'),strong=document.createElement('strong');strong.textContent=row.name;name.append(strong);
      for(const value of [row.level?`${levelLabel} ${row.level}`:'',row.summary])if(value){const small=document.createElement('small');small.textContent=value;name.append(small);}
      const kind=document.createElement('span');kind.className='row-type';kind.textContent=row.type;
      const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');a.append(img,name,kind,arrow);li.append(a);return li;
    }
    function update(mode='replace',focus=false) {
      const q=normalize(state.q);
      let matched=rows.filter(r=>normalize(r.search).includes(q)&&(!state.type||r.type===state.type)&&r.level>=state.minLevel&&facets.every(s=>!state[s.dataset.facet]||r.facets[s.dataset.facet]?.includes(state[s.dataset.facet])));
      if(state.sort!=='default')matched=[...matched].sort((a,b)=>state.sort==='level'?a.level-b.level:a.name.localeCompare(b.name,locale,{numeric:true}));
      const page=paginate(matched,state.page);state.page=page.page;
      list.replaceChildren(...page.rows.map(createRow));
      counter.textContent=rangeText(counter.dataset.range,page,locale)+(matched.length!==rows.length?` · ${counter.dataset.all} ${rows.length}`:'');
      $('[data-list-empty]').hidden=Boolean(page.total);
      if($('[data-pagination]'))$('[data-pagination]').hidden=true;
      showPager(page);writeState(base,state,mode);if(focus)focusResults(list);
    }
    wirePager(delta=>{state.page+=delta;update('push',true);});
    for(const [key,control] of Object.entries(controls))control.addEventListener('input',()=>{state[key]=key==='minLevel'?Math.max(0,Number(control.value)||0):control.value;state.page=1;update(control.tagName==='SELECT'?'push':'replace');});
    for(const button of all('[data-reset-filters]'))button.addEventListener('click',()=>{state=readState(new URL(base,location.href));for(const [key,control] of Object.entries(controls))control.value=state[key];update('push');query.focus();});
    addEventListener('popstate',()=>{restore();update();});
    restore();$('[data-filters]').hidden=false;update();
  } catch { /* Keep static pages and links available if the index cannot be loaded. */ }
}
const navigation=$('#navigation');
if(navigation&&matchMedia('(max-width: 760px)').matches)navigation.open=false;
