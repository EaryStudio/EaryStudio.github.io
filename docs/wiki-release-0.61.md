# Wiki update: game release 0.61

Prepared and reviewed on 2026-10-26. The developer authorized publication on
2026-10-26. This website update deploys through the existing Pages workflow; no
Player build is required.

Game source: `012dfc01d311534264970424f8f958512cca9137`.
Previous wiki source: `922a2fcad6f658901a5d06ef96ddfce3ea3c0699` (0.60).
Exporter remains 1.4.1; schema remains version 1. The active Android Profile reports
0.61, and the source checkout was clean before updating the publication profile.
Unity CLI 1.0.0-beta.14 was checked against its latest release before exporting.

## Reviewed changes

The six release StringTables add six patch-note entries under five sections:

- Equipment: fix equipped potions/food occasionally disappearing during restoration.
- Tutorials: Action and Food become usable after their prerequisite objectives.
- PC UI: correct fullscreen tooltip scaling and overlapping queue-window lines.
- Buffs: show the Life Skills affected by Camping and Writing (Drama) buffs.
- Performance: reduce reward-popup and sound lag.

Source review confirms the battle Action button now checks completed MO0008, and
the battle Food button checks completed MO0006. These are battle-UI availability
conditions, not new item equip requirements or changes to the objective assets.
The buff changes select presentation layers/icons using existing target skill IDs;
they do not alter the buff values, duration or target definitions. Equipment and
potion changes defer consumers until saved ownership is restored. The wiki does
not simulate player save restoration or copy runtime UI state into static data.

All 3,180 non-patch-note entities are identical to 0.60: values, relationships,
names, descriptions and representative images. This includes seed quantities,
Carpentry acquisition/use relationships, Camping and Writing effect tables.
No gameplay definition assets changed. No additional wiki adapter is required.
The new runtime buff decoration assets are not copied into the public package.

The package contains 3,208 records: one new patch note, 27 existing patch-note
ordering changes and no removals. Each locale changes exactly two string keys:
PATCH_NOTES_BODY_0_61 and PATCH_NOTES_VERSION_LIST. Older patch-note bodies are
unchanged. Game wording and source formatting are preserved without authored
explanations or English fallback. Existing publication approvals and stable IDs
are retained; only the new patch-note record is approved.

## Validation

- Import schema, hashes, source references and all six locales passed.
- Website and callback tests: all 69 passed.
- Two exports produced identical bytes for all 1,476 package files.
- Diagnostics retain 102 representative-image warnings and 12 existing CSV/StringTable
  differences (three combat action names in Chinese and the Carpentry prerequisite
  label in six languages). Release StringTables remain authoritative; the new
  patch-note body has no fallback.
- Independent comparison against the committed 0.60 snapshot confirms the complete
  non-patch-note entity equality and the two changed string keys per locale.
- The release test verifies six entries/five sections in each locale, translation
  provenance, new static routes and search indexing. Previous 0.58/0.59 relation
  checks and the 0.60 planting-quantity regression remain active.
- Runtime code, assets, settings and player saves were not changed. Export kept
  Android Profile, InitialScene clean and Play Mode stopped. Only the publication
  profile changed in the game repository. Exporter code is unchanged, so its
  existing Unity test suite was not rerun for this data-only update.

- Full build generated 19,741 static pages. All 21,463 output files (260.8 MiB)
  passed internal-link and original-site preservation checks with no failures.
- Browser review confirmed the Korean 0.61 page, all six entries and five sections,
  the 0.61 version label, and language switching to the matching English page.
  The local preview remains available for review.

## Review locally

After npm run verify, run node scripts/wiki/serve.mjs:

- http://127.0.0.1:8088/iris/wiki/ko/patch-notes/0.61/
- http://127.0.0.1:8088/iris/wiki/en/patch-notes/0.61/
- http://127.0.0.1:8088/iris/wiki/ko/items/fus0001/

The developer reviewed the preview and authorized publication on 2026-10-26.
Only the website repository is pushed for deployment. The game publication profile
remains local; the exporter/importer never pushes either repository.
