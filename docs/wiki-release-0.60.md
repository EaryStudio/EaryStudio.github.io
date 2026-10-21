# Wiki update: game release 0.60

Prepared and reviewed on 2026-10-21. The developer subsequently authorized
publication of this snapshot. The Pages workflow verifies the committed website
release before deployment; no game Player build or game repository push is needed.

Game source: `922a2fcad6f658901a5d06ef96ddfce3ea3c0699`.
Previous wiki source: `3f227a17027f7ac76088aebda7542f01f55b05f5` (0.59).
Exporter: 1.4.1; schema remains version 1. The active Android profile and the
game's PC release audit identify version 0.60.

## Reviewed changes

No item balance, passive recipe, action input/output, price or acquisition/use
relation changed from 0.59. Existing names, descriptions and exported images are
unchanged. The six release StringTables add three patch-note entries:

- Farming: item information now also shows the number of seeds required to plant.
- Stats: improved the Stats window.
- Start Screen: improved the start screen artwork.

The wiki now displays planting quantities on 56 seed item pages using the exact
game UI translation in all six locales. The exporter follows ItemDetailBuilder's
rule: sum matching positive item costs per Farming recipe and select the smallest
positive total. It excludes currency inputs and non-Farming recipes. Examples:
Oak Acorn 1, Strawberry Seed 3, Basil Seed 12 and Potato Seed 2. The original
recipe input tables and item Uses retain their existing quantities and links.

The game's Stats window exposes the current player's state; this update does not
invent static player values for the wiki. The Stats and start-screen artwork
changes are reflected in patch notes. Existing wiki branding/background assets
remain unchanged.

The package contains 3,207 records: one new patch-note record, 56 added seed
quantity fields, 26 existing patch-note ordering changes and no removals. Each
locale changes exactly three string keys: the new patch body, the version list,
and the planting-quantity format. All other exported entity data, relations and
translation values match the previous snapshot.

## Validation

- Import schema, file hashes, references and all six locales passed.
- Website/callback tests: 68 passed, including six-language planting display,
  unsupported quantity rejection, patch notes and the 0.58/0.59 relation regressions.
- Unity WikiExportTests: 12 passed after the final exporter change, including
  repeated recipe inputs, minimum quantity, non-Farming and currency exclusion.
- The 70 exported Farming recipes exactly match the recipes configured in the game MainScene; all 56 seed quantities match their input totals.
- Two exports produced identical bytes for all 1,476 package files.
- Export diagnostics contain 102 existing image warnings and 12 CSV/StringTable
  differences: three combat action names in Simplified/Traditional Chinese, and
  UI_CARPENTRY_REQUIRES_PROJECT in six locales. Release StringTables remain the
  source of truth; those exported strings are unchanged from 0.59. The new patch
  notes and planting label have no language fallback.
- Runtime code, gameplay assets, save data and settings were not changed. Unity's
  compilation-time deletion of generated Addressables link.xml files was restored
  to their original tracked bytes. Only Editor wiki tools, tests, the publication
  profile and documentation changed in the game repository.

- Full npm run verify passed: Eleventy generated 19,735 pages; all 21,457 output
  files (260.8 MiB) passed internal-link and original-site byte preservation checks.
- Browser review passed the Korean 0.60 patch notes, seed quantity panel and icons,
  and the Uses link to the matching three-seed Strawberry recipe. The local
  patch-note tab is retained for review.

## Review locally

After `npm run verify`, run `node scripts/wiki/serve.mjs`:

- http://127.0.0.1:8088/iris/wiki/ko/patch-notes/0.60/
- http://127.0.0.1:8088/iris/wiki/ko/items/fus0001/
- http://127.0.0.1:8088/iris/wiki/ko/items/hbs0001/

The developer reviewed the preview and authorized publication on 2026-10-21.
Website and game-tool changes are committed separately; only the website is
pushed for deployment. The exporter and importer never perform a cross-repository push.
