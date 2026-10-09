import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWiki } from '../../scripts/wiki/model.mjs';
import { renderData } from '../../scripts/wiki/render.mjs';

test('0.57 exports the three purchase caps without restricting reward acquisition', async () => {
  const w=await loadWiki();
  assert.equal(w.manifest.release,'0.57');
  assert.equal(w.manifest.sourceRevision,'12ae9600ef534462fe440c2a1fa78b01cfd5168f');
  const affected=w.entities.filter(e=>e.kind==='items'&&e.data.slotPurchaseLimit);
  assert.deepEqual(affected.map(e=>e.wikiId).sort(),['items:ticket0001','items:ticket0002','items:ticket0003']);
  for(const [id,cap] of [['ticket0001',450],['ticket0002',18],['ticket0003',9]]) {
    const item=w.ids.get(`items:${id}`),limit=item.data.slotPurchaseLimit;
    assert.deepEqual(limit,{maximumSlots:cap,slotsPerTicket:1,ownedTicketsCountTowardLimit:true,purchaseOnlyRestriction:true});
    const offers=w.entities.filter(e=>e.kind==='offers'&&e.data.item?.ref===item.wikiId);
    assert.ok(offers.length>0);
    for(const offer of offers)assert.deepEqual(offer.data.slotPurchaseLimit,limit);
    for(const locale of w.manifest.locales){
      const html=renderData(item,locale,w);
      assert.ok(html.includes(w.dictionaries[locale].fields.slotPurchaseLimit));
      assert.ok(html.includes(w.dictionaries[locale].fields.ownedTicketsCountTowardLimit));
    }
  }
  for(const shop of w.entities.filter(e=>e.kind==='shops'&&e.data.offers?.some(r=>w.ids.get(r.ref)?.data.slotPurchaseLimit)))
    for(const locale of w.manifest.locales)assert.ok(renderData(shop,locale,w).includes(w.dictionaries[locale].fields.slotPurchaseLimit));
  assert.ok(w.ids.has('patch-notes:0.57'));
});
