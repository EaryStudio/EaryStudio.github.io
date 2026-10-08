export const filterKeys = ['q','type','minLevel','sort','rarity','slot','skill','source'];
export function readState(url) {
  const u=new URL(url),p=u.searchParams;
  const state=Object.fromEntries(filterKeys.map(k=>[k,p.get(k)??'']));
  state.sort=['default','name','level'].includes(state.sort)?state.sort:'default';
  state.minLevel=Math.max(0,Number(state.minLevel)||0);
  state.page=Math.max(1,Math.floor(Number(p.get('page')??u.pathname.match(/\/page\/(\d+)\/$/)?.[1])||1));
  return state;
}
export function stateUrl(current,base,state) {
  const u=new URL(base,current);u.hash=new URL(current).hash;
  for(const key of filterKeys)if(state[key]&&!(key==='sort'&&state[key]==='default'))u.searchParams.set(key,String(state[key]));
  if(state.page>1)u.searchParams.set('page',String(state.page));
  return u.pathname+u.search+u.hash;
}
export function paginate(rows,page,size=50) {
  const pages=Math.max(1,Math.ceil(rows.length/size));
  page=Math.max(1,Math.min(Math.floor(page)||1,pages));
  return {page,pages,total:rows.length,start:rows.length?(page-1)*size+1:0,end:Math.min(page*size,rows.length),rows:rows.slice((page-1)*size,page*size)};
}
export function rangeText(template,page,locale) {
  const n=new Intl.NumberFormat(locale);
  return template.replace(/\{(start|end|total)\}/g,(_,key)=>n.format(page[key]));
}
