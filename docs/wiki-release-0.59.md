# Wiki update: game release 0.59

Prepared and reviewed on 2026-10-17. The developer subsequently authorized
publication of this snapshot. The Pages workflow verifies the committed website
release before deployment; no game Player build or game repository push is needed.

Game source: `3f227a17027f7ac76088aebda7542f01f55b05f5`.
Previous wiki source: `e1b70899813c6eb6e3f31f3efaefad8229df8c29` (0.58).
Exporter: 1.4.0, unchanged from the published 0.58 exporter. The current Android
release profile and the game's recorded PC build audit identify release 0.59.
The source checkout is clean apart from the wiki publication profile and an
unrelated untracked promotional image outside Assets; the image is not exported.

## Reviewed changes

| Action | Required Carpentry level | Wood inputs | One-time base XP |
| --- | --- | --- | --- |
| Make Storage Space (`CNH0003`) | 20 → 10 | Pine → Maple Plank ×200 and Beam ×40 | 120 → 70 |
| Wooden Chest (`CNF0007`) | 20 → 10 | Pine → Maple Plank ×120 and Beam ×20 | 30 → 15 |

Other inputs, durations, prerequisites, permanent effects and repeatability remain
unchanged. The same source relations update action details, skill tables and item
Uses: Maple Plank/Beam gain these two uses, and Pine Plank/Beam lose only these two
uses. Maple Beam having no material use was accurate for 0.58, but no longer applies
to 0.59. The historical 0.58 audit fixture is retained; the current fixture includes
these four independently reviewed item-relation changes.

The six game StringTables add the 0.59 patch notes with five entries: the two
balance changes, queue quantity-button hit area fix, one-time completion display
improvements and prerequisite lock-state refresh fix. The game UI code changes
need no website adapter change. No game numbers or explanatory prose were manually
inserted into the exported snapshot.

The package contains 3,206 records: one added patch note, no removed records,
two changed actions and 25 existing patch-note ordering changes. No existing
entity names, descriptions or images changed. Each locale adds the 0.59 body and
prepends 0.59 to the version list; older patch-note text is unchanged.

## Validation and preview

- Import schema, hashes, references and all six locales validated.
- Website and callback tests: 66 passed, including exact release balance, all
  29 Carpentry item acquisition/use sets, six-language links and five patch-note entries.
- Two exports produced identical bytes for all 1,476 package files.
- `npm run verify` passed: Eleventy generated 19,729 static pages; the complete
  21,451-file output (260.7 MiB) passed internal-link validation and byte-for-byte
  preservation checks for the original homepage, authentication callback, public
  configuration and Android association files.
- Browser review passed the two modified actions, Maple Beam uses and Korean
  patch notes. The local review tab is retained in Codex.
- Export diagnostics retain six existing CSV/StringTable differences for three
  combat action names in Simplified/Traditional Chinese. The release StringTables
  remain authoritative; the new patch notes have no translation fallback.
- Export preserved the game source/settings and the Editor state: Android Profile,
  InitialScene clean, Play Mode stopped, version 0.59. Only the wiki registry changed.
- The publication registry retains existing approvals and IDs and approves only
  the new derived patch-note record. No exporter/runtime/schema changes were needed.

Preview after `npm run verify` with `node scripts/wiki/serve.mjs`:

- `http://127.0.0.1:8088/iris/wiki/ko/patch-notes/0.59/`
- `http://127.0.0.1:8088/iris/wiki/ko/skills/life.carpentry/`
- `http://127.0.0.1:8088/iris/wiki/ko/actions/cnh0003/`
- `http://127.0.0.1:8088/iris/wiki/ko/actions/cnf0007/`
- `http://127.0.0.1:8088/iris/wiki/ko/items/cnt0002/#uses`

Reports: `reports/wiki-import.json`, `reports/059-semantic-diff.json`,
`reports/059-verify.txt` and `reports/wiki-build.json`. Export diagnostics remain
under the game repository's ignored `Exports/Wiki/reports/` directory.
