import fs from 'node:fs/promises';
import { validatePackage, locales, sha256 } from './validate.mjs';
import { expeditionSources } from './acquisition.mjs';
import { organize } from './organization.mjs';
import { currencyRelations } from './currency-relations.mjs';
import { decorateEntities, sortEntities, applyGameLabels } from './presentation.mjs';

export function siteConfig(basePath = process.env.BASE_PATH ?? '/') {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(basePath)) throw new Error('BASE_PATH must start and end with / and contain safe segments');
  const siteOrigin = process.env.SITE_ORIGIN ?? 'https://earystudio.github.io';
  if (new URL(siteOrigin).origin !== siteOrigin) throw new Error('SITE_ORIGIN must be an origin without a path');
  return { siteOrigin, basePath, wikiPath: `${basePath}iris/wiki/`, communityLinks: [
    {label:'Steam',url:'https://store.steampowered.com/app/5062420/'},
    {label:'Google Play',url:'https://play.google.com/store/apps/details?id=com.earystudio.irissidlelog'},
    {label:'Discord',url:'https://discord.gg/4P5sAR3eHa'}
  ] };
}
export const rawRoute = (config, locale, entity) => `${config.wikiPath}${locale}/${entity ? `${entity.kind}/${entity.slug}/` : ''}`;
export const route = (config, locale, entity) => rawRoute(config,locale,config.entityRoutes?.get(entity?.wikiId)??entity);
export const normalize = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('en').replace(/\s+/g, ' ').trim();
export function searchIndex(entities, locale, config, labels = {}) {
  return entities.map(e => ({ id: e.wikiId, gameId: e.gameId, name: plain(e.names[locale]), names: [...new Set([...Object.values(e.names), ...e.aliases].map(plain))], kind: e.kind, kindLabel: labels[e.kind] ?? e.kind, url: route(config, locale, e), description: plain(e.descriptions[locale]).slice(0, 170), level: e.data.enemyLevel ?? e.data.areaLevel ?? null }));
}
export function reverseRelations(entities) {
  const reverse = new Map(entities.map(e => [e.wikiId, []]));
  for (const source of entities) for (const relation of source.relations) reverse.get(relation.target).push({ ...relation, source: source.wikiId });
  return reverse;
}
export function plain(value) { return String(value ?? '').replace(/<sprite\b[^>]*>/gi, ' ◇ ').replace(/<[^>]*>/g, '').replace(/\\n/g, '\n'); }
export async function loadWiki() {
  const snapshot = await validatePackage('data/iris');
  const systems = new Map(snapshot.entities.filter(e=>e.kind==='systems').map(e=>[e.slug,e.data]));
  // Filters read these dictionaries; templates do not need Eleventy to merge them per page.
  const gameStrings = new Map(await Promise.all(locales.map(async locale => [locale, JSON.parse(await fs.readFile(`data/iris/locales/${locale}.json`, 'utf8'))])));
  const specialLabels = JSON.parse(await fs.readFile('i18n/wiki/special.json','utf8'));
  // Preserve the source package while excluding removed website sections everywhere.
  const entities = snapshot.entities.filter(entity => !['rules', 'systems'].includes(entity.kind)).map(e=>({...e,names:{...e.names},data:{...e.data}}));
  const ids = new Map(entities.map(entity => [entity.wikiId, entity]));
  // Serialized achievement unions contain a default MaxHP even for unrelated conditions.
  for(const entity of entities)if(entity.kind==='achievements')entity.relations=entity.relations.filter(r=>r.field!=='data.statType'||entity.data.conditionType==='StatThreshold');
  const config = siteConfig();
  const dictionaries = Object.fromEntries(await Promise.all(locales.map(async locale => [locale, JSON.parse(await fs.readFile(`i18n/wiki/${locale}.json`, 'utf8'))])));
  const fieldTranslations = JSON.parse(await fs.readFile('i18n/wiki/fields.json', 'utf8'));
  const terms = JSON.parse(await fs.readFile('i18n/wiki/presentation.json', 'utf8'));
  for (const [index, locale] of locales.entries()) dictionaries[locale].fields = Object.fromEntries(Object.entries(fieldTranslations).map(([key, values]) => [key, values[index]]));
  for (const [index, locale] of locales.entries()) dictionaries[locale].terms = Object.fromEntries(Object.entries(terms).map(([key, values]) => [key, values[index]]));
  for(const locale of locales)applyGameLabels(JSON.parse(await fs.readFile(`data/iris/locales/${locale}.json`,'utf8')),dictionaries[locale]);
  decorateEntities(entities, {dictionaries});
  const groups = Object.groupBy(entities, e => e.kind);
  groups['patch-notes']?.sort((a, b) => a.data.order - b.data.order);
  const organization = organize(entities);
  config.entityRoutes=new Map([...organization.mergedInto].map(([oldId,newId])=>[oldId,ids.get(newId)]));
  for(const [actionId,children]of organization.mergedContent){
    const action=ids.get(actionId);
    action.aliases=[...new Set([...action.aliases,...children.flatMap(id=>{const e=ids.get(id);return [e.wikiId,e.gameId,...Object.values(e.names)];})])];
  }
  const kinds = ['items', 'monsters', 'locations', 'skills', 'actions', 'recipes', 'slots', 'familiars', 'targets', 'combat-actions', 'stats', 'objectives', 'achievements', 'statistics', 'shops', 'offers', 'currencies', 'challenges', 'museum', 'patch-notes', 'guides'].filter(k => groups[k]);
  const indexes = {}; const pages = [];
  const mergedCategories={familiars:'skills:life.familiartraining',targets:'skills:life.stealth','combat-actions':'skills:life.training',offers:null};
  const navigationKinds = kinds.filter(k => !['actions', 'guides', 'rules',...Object.keys(mergedCategories)].includes(k));
  const migrations = JSON.parse(await fs.readFile('data/wiki-migrations.json', 'utf8'));
  const oldPaths = new Set();
  for (const migration of migrations) {
    const id = `${migration.kind}:${migration.slug}`;
    if (!/^[a-z-]+:[a-z0-9][a-z0-9._-]*$/.test(id) || !migration.removedIn || oldPaths.has(id) || snapshot.ids.has(id)) throw new Error(`Invalid migration: ${id}`);
    if (migration.replacement && !snapshot.ids.has(migration.replacement)) throw new Error(`Missing migration replacement: ${migration.replacement}`);
    oldPaths.add(id);
  }
  for (const locale of locales) {
    const json = JSON.stringify(searchIndex(entities.filter(e=>!organization.mergedInto.has(e.wikiId)), locale, config, dictionaries[locale]));
    const hash = sha256(json).slice(0, 12); indexes[locale] = { file: `search-${locale}.${hash}.json`, json };
    const common = { locale, ui: dictionaries[locale], locales };
    for (const migration of migrations) pages.push({ ...common, type: 'tombstone', migration, title: migration.title ?? migration.slug, url: `${config.wikiPath}${locale}/${migration.kind}/${migration.slug}/` });
    pages.push({ ...common, type: 'home', title: dictionaries[locale].wiki, url: route(config, locale) });
    pages.push({ ...common, type: 'search', title: dictionaries[locale].search, url: `${route(config, locale)}search/` });
    for (const kind of kinds) {
      const all=sortEntities(groups[kind],locale); const count=kind==='patch-notes'?1:Math.ceil(all.length/50);
      const urls=Array.from({length:count},(_,i)=>`${route(config,locale)}${kind}/${i?`page/${i+1}/`:''}`);
      if(Object.hasOwn(mergedCategories,kind)){
        const destination=mergedCategories[kind]?route(config,locale,ids.get(mergedCategories[kind])):`${route(config,locale)}shops/`;
        for(const url of urls)pages.push({...common,type:'forward',title:dictionaries[locale][kind],url,canonicalUrl:destination});
        continue;
      }
      for(let i=0;i<count;i++)pages.push({...common,type:'list',kind,title:dictionaries[locale][kind],entities:kind==='patch-notes'?all:all.slice(i*50,(i+1)*50),allEntities:all,total:all.length,pageNumber:i+1,pageUrls:urls,contextualGuideIds:i===0?organization.contextualGuides.get(kind)??[]:[],url:urls[i]});
    }
    for (const entity of entities) {
      if(organization.mergedInto.has(entity.wikiId)){
        pages.push({...common,type:'forward',title:plain(entity.names[locale]),url:rawRoute(config,locale,entity),canonicalUrl:route(config,locale,entity)});
        continue;
      }
      const children=organization.skillActions.get(entity.wikiId)??[];
      const childUrls=Array.from({length:Math.ceil(children.length/50)},(_,i)=>`${route(config,locale,entity)}${i?`actions/page/${i+1}/`:''}`);
      const detail={ ...common, type: 'entity', entity, parentSkill: organization.parentSkills.get(entity.wikiId), parentShopIds:organization.parentShops.get(entity.wikiId)??[], mergedIds:organization.mergedContent.get(entity.wikiId)??[], skillActionIds:children.slice(0,50), allSkillActionIds:children, pageNumber:1,pageUrls:childUrls,contextualGuideIds:organization.contextualGuides.get(entity.wikiId)??[],title:plain(entity.names[locale]),url:route(config,locale,entity)};
      pages.push(detail);
      for(let i=1;i<childUrls.length;i++)pages.push({...detail,type:'skill-actions',title:`${common.ui.skillActions} · ${common.ui.terms.page} ${i+1}`,parentSkill:entity.wikiId,skillActionIds:children.slice(i*50,(i+1)*50),pageNumber:i+1,url:childUrls[i]});
    }
  }
  const derived = expeditionSources(entities, ids);
  for(const [id,relations] of currencyRelations(entities,systems))derived.set(id,[...(derived.get(id)??[]),...relations]);
  const relationEntities = entities.map(e => ({ wikiId: e.wikiId, relations: [...e.relations, ...(derived.get(e.wikiId) ?? [])] }));
  const byGameId = new Map();
  for (const entity of entities) {
    const key = `${entity.kind}:${entity.gameId}`;
    byGameId.set(key, byGameId.has(key) ? null : entity);
  }
  return { ...snapshot, entities, ids, systems, gameStrings, specialLabels, ...organization, config, dictionaries, groups, kinds, navigationKinds, indexes, pages, derived, byGameId, reverse: reverseRelations(relationEntities) };
}
