import fs from 'node:fs/promises';
import path from 'node:path';
import { loadWiki, route, plain } from './scripts/wiki/model.mjs';
import { renderData, renderRelations, renderRelationSections, relationsTitle, listRecord, escape, imageUrl } from './scripts/wiki/render.mjs';
import { sha256 } from './scripts/wiki/validate.mjs';
import { sortEntities } from './scripts/wiki/presentation.mjs';
import sharp from 'sharp';

export default function(eleventy) {
  eleventy.setNunjucksEnvironmentOptions({ autoescape: true });
  let wiki;
  eleventy.addGlobalData('wiki', async () => {
    wiki=await loadWiki(); wiki.listIndexes={};
    for(const page of wiki.pages.filter(p=>p.type==='list'&&p.kind!=='patch-notes')){
      const key=`${page.locale}-${page.kind}`;
      if(!wiki.listIndexes[key]){const json=JSON.stringify(sortEntities(wiki.groups[page.kind],page.locale).map(e=>listRecord(e,page.locale,wiki)));wiki.listIndexes[key]={file:`list-${key}.${sha256(json).slice(0,12)}.json`,json};}
      page.listIndexUrl=`${wiki.config.wikiPath}lists/${wiki.listIndexes[key].file}`;
    }
    for(const page of wiki.pages.filter(p=>p.allSkillActionIds?.length)){
      const key=`${page.locale}-skill-${page.entity.slug}`;
      if(!wiki.listIndexes[key]){const json=JSON.stringify(page.allSkillActionIds.map(id=>listRecord(wiki.ids.get(id),page.locale,wiki)));wiki.listIndexes[key]={file:`list-${key}.${sha256(json).slice(0,12)}.json`,json};}
      page.listIndexUrl=`${wiki.config.wikiPath}lists/${wiki.listIndexes[key].file}`;
    }
    return wiki;
  });
  for (const name of ['index.html', '404.html', 'css', 'assets', 'steam-auth', 'config', '.well-known', '.nojekyll']) eleventy.addPassthroughCopy({ [name]: name });
  eleventy.addPassthroughCopy({ 'src/wiki/client': 'iris/wiki/client' });
  eleventy.addFilter('plain', plain);
  eleventy.addFilter('entityImage', entity => entity.image ?? wiki.presentationImages.get(entity.wikiId));
  eleventy.addFilter('categoryImage', entities => entities.map(entity => entity.image ?? wiki.presentationImages.get(entity.wikiId)).find(Boolean));
  eleventy.addFilter('entityById', id => wiki.ids.get(id));
  eleventy.addFilter('entitiesByIds', ids => ids.map(id => wiki.ids.get(id)));
  eleventy.addFilter('entityUrl', (id, locale) => route(wiki.config, locale, typeof id === 'string' ? wiki.ids.get(id) : id));
  eleventy.addFilter('dataHtml', (entity, locale) => renderData(entity, locale, wiki));
  eleventy.addFilter('relationsHtml', (entity, locale) => renderRelations(entity, locale, wiki));
  eleventy.addFilter('relationSections', (entity, locale) => renderRelationSections(entity, locale, wiki));
  eleventy.addFilter('relationsTitle', (entity,locale)=>relationsTitle(entity,locale,wiki));
  eleventy.addFilter('listRecord', (entity,locale)=>listRecord(entity,locale,wiki));
  eleventy.addFilter('facets', (entity, locale) => JSON.stringify({
    rarity: entity.data.rarity ? [entity.data.rarity] : [],
    slot: entity.data.validSlots ?? [],
    skill: [...new Set(entity.relations.filter(r => r.target.startsWith('skills:')).map(r => plain(wiki.ids.get(r.target).names[locale])))],
    source: [...new Set((wiki.reverse.get(entity.wikiId) ?? []).filter(r => r.role === 'rewards' || wiki.ids.get(r.source).kind === 'offers').map(r => wiki.dictionaries[locale][wiki.ids.get(r.source).kind]))]
  }));
  eleventy.addFilter('levelOf', entity => entity.data.enemyLevel ?? entity.data.areaLevel ?? Math.max(0, ...(entity.data.requiredSkillLevels ?? []).map(r => r.minLevel)));
  eleventy.addFilter('imageUrl', image => imageUrl(image, wiki.config));
  eleventy.addFilter('withoutBase', url => url.slice(wiki.config.basePath.length - 1));
  eleventy.addFilter('localeUrl', (page, locale) => (page.canonicalUrl??page.url).replace(`${wiki.config.wikiPath}${page.locale}/`, `${wiki.config.wikiPath}${locale}/`));
  eleventy.addShortcode('wikiEntity', (wikiId, locale = 'en') => {
    const e = wiki.ids.get(wikiId); if (!e) throw new Error(`Unknown guide reference: ${wikiId}`);
    return `<a href="${route(wiki.config, locale, e)}">${escape(plain(e.names[locale]))}</a>`;
  });
  eleventy.addShortcode('wikiValue', (wikiId, field) => {
    const entity = wiki.ids.get(wikiId); if (!entity || !Object.hasOwn(entity.data, field)) throw new Error(`Unknown guide value: ${wikiId}.${field}`);
    const value = entity.data[field]; if (value && typeof value === 'object') throw new Error('wikiValue needs a scalar; link to the data table instead');
    return escape(String(value));
  });
  eleventy.on('eleventy.after', async ({ dir }) => {
    const output = dir.output;
    await fs.mkdir(path.join(output, 'iris/wiki/search'), { recursive: true });
    await fs.mkdir(path.join(output,'iris/wiki/lists'),{recursive:true});
    for(const index of Object.values(wiki.listIndexes))await fs.writeFile(path.join(output,'iris/wiki/lists',index.file),index.json);
    for (const index of Object.values(wiki.indexes)) await fs.writeFile(path.join(output, 'iris/wiki/search', index.file), index.json);
    await fs.mkdir(path.join(output, 'assets/wiki'), { recursive: true });
    const assets = Object.keys(wiki.manifest.files).filter(f => f.startsWith('assets/'));
    // Bound memory use and preserve pixel icons without resizing or recompression.
    for (const asset of assets) {
      const input = path.join('data/iris', asset); const metadata = await sharp(input).metadata();
      if (metadata.width > 640 || metadata.height > 640) await sharp(input).resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.join(output, 'assets/wiki', path.basename(asset, '.png') + '.webp'));
      else await fs.copyFile(input, path.join(output, 'assets/wiki', path.basename(asset)));
    }
    const urls = [wiki.config.wikiPath, ...wiki.pages.filter(p=>p.type!=='forward').map(p => p.url)];
    await fs.writeFile(path.join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(url => `<url><loc>${escape(wiki.config.siteOrigin + url)}</loc></url>`).join('') + '</urlset>');
  });
  return { dir: { input: 'src', output: '_site', includes: 'wiki/_includes' }, htmlTemplateEngine: 'njk', markdownTemplateEngine: 'njk' };
}
