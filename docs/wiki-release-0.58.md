# Wiki update: game release 0.58

The developer reviewed this update and explicitly authorized publication on 2026-10-16. The Pages workflow verifies the committed release before deploying it.

Game source: `e1b70899813c6eb6e3f31f3efaefad8229df8c29`.
Previous wiki source: `12ae9600ef534462fe440c2a1fa78b01cfd5168f` (0.57).
Exporter: 1.4.0. The Android release profile and the recorded PC 0.58 build audit
identify this content release; the global Editor version is not used as evidence.

## Content and presentation

- Added the 0.58 patch notes using all six game StringTables. The notes cover
  Carpentry, the objective completion sound, and the equipment/loadout ownership fix.
- Added Carpentry with 26 wood-processing actions, eight space projects, and
  16 furniture types with three construction/improvement levels each.
- Permanent projects display prerequisite action links, one-time completion,
  furniture effects at each tier and the alternative furniture sharing a slot.
  Percentages come from the project catalog. Requirements use `ConstructionRules`;
  descriptions use the game's `UI_CARPENTRY_*` translations and skill names.
- The Carpentry skill includes the game guide and grouped furniture tables. No
  separate navigation tab, invented strategy guide or player-save simulation is added.
- Added related materials, a potion, two special equipment items, two familiars
  and four objectives. The equipment comes from CHESTD0004/CHESTD0008, each at
  0.4%; wood processing does not award these equipment items.
- The new objective condition links to the required permanent project. The
  completion requirement for skill-unlock rewards is preserved.
- Retained slot-ticket purchase limits from 0.57, including offer detail pages.
- Existing pagination tests now verify complete coverage against the imported
  catalog size, and search verifies all matches beyond the former 80-result cap.

The original game checkout's runtime code, assets, settings and saves are not
modified by these wiki adapters. Export runs from a separate checkout of the
source revision with only the reviewed wiki profile/tools applied.

The imported package contains 3,205 records: 123 additions and no removals.
The 191 changed existing records include two chest reward tables, 165 objectives
with the new optional action/completion fields (and the next main-objective link),
and 24 patch-note ordering fields. These are not 191 balance changes. Existing
entity names and descriptions are unchanged. Icons changed on 102 existing records
(32 actions, 18 familiars, 50 items and two objectives), using the release sprites.

## Verification

- Unity Editor Wiki tests: 33 passed, including all permanent-project prerequisites
  against the runtime's pure completion rules.
- Website and authentication callback tests: 64 passed after the item relation audit. Tests cover the complete
  Carpentry catalog, six-language rendering, chest drops and merged familiar pages.
- Both exports produced identical bytes for all 1,476 package files.
- Import validation passed schemas, hashes, references and all six locales.
- Eleventy generated 19,723 pages. The complete 21,445-file output (265.4 MiB)
  passed internal-link checks and byte-for-byte original-site preservation checks,
  including authentication callbacks, public config and Android association files.
- Browser checks passed the Carpentry overview, furniture prerequisites/effects,
  new equipment and familiar pages, new objective links and patch notes. New icons
  loaded successfully; Carpentry and patch notes fit a 320 px viewport without
  document-level horizontal overflow. The game guide remains collapsed initially.
- During local review, no publication was performed. A loopback-only
  preview is available at `http://127.0.0.1:8088/iris/wiki/ko/skills/life.carpentry/`.

## Review

### Follow-up item relation audit

All 29 added items were independently compared against the release's serialized
ScriptableObjects: 33 acquisition links and 126 material/submission links match,
including quantities and probabilities. All links appear in the correct section
in six languages. These counts exclude the generic sell-for-gold link.

- Planks and timber: each has its matching Carpentry production action. Furniture,
  space projects and plank-to-timber conversion are uses, not acquisition sources.
- Main objective 29 consumes 10 oak planks and awards 10 oak timber. Main objective
  31 awards 20 maple planks and 20 pine planks.
- The Carpentry speed potion comes from Brewing and main objective 30 (20 potions).
- The two equipment items come from their respective chests at 0.4% each.
- Maple timber has no material/submission use in the 0.58 source assets. Its
  absence from furniture recipes is a game-data fact, not a missing wiki link.

The audit found a presentation omission: the item usage link to a submission
objective did not show its required quantity. Usage details now show that amount
(10 for oak planks), using the existing exported `targetCount`. Equipment conditions
do not inherit that submission quantity. The public snapshot was not edited.
It also found a misleading shared note: fixed material costs and submission counts
were labeled as uncertain reward entries. This note now appears only for multiple
reward contexts containing a probability below one or weighted choice. Fixed costs,
submission quantities and guaranteed production no longer receive that note.
The reviewed acquisition/use sets are retained as a regression fixture.
The follow-up website test run passed all 64 tests.
After the notice fix, all 13 relation/release regression tests passed. A full
Eleventy rebuild and checks of all 174 localized new-item pages confirmed the
expected source/use links and corrected submission details. The Korean oak-plank
page was also verified in the browser. The developer subsequently authorized publication.

Run `npm run verify`, then `node scripts/wiki/serve.mjs` and review:

- `/iris/wiki/ko/patch-notes/0.58/`
- `/iris/wiki/ko/skills/life.carpentry/`
- `/iris/wiki/ko/actions/cnh0001/`
- `/iris/wiki/ko/actions/cnf0001/`
- `/iris/wiki/ko/items/spenonc0050/`
- `/iris/wiki/ko/objectives/mo0028/`

Export/import diagnostics and local build reports are stored under the repositories'
ignored report directories. Follow [wiki maintenance](wiki-maintenance.md) for
publication only after the developer's review and authorization.
