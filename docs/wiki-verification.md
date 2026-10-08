# Initial wiki verification — 0.56

Verified locally on 2026-10-07 with Unity 6000.3.9f1, Node.js 24.19 and Chrome.
Source revision: `fd02bba2d2e4e677e39a0334461c3a9d61d5f0ee`.
Exporter source hash after image support: `47df9eee77e652a2e02bf02785f8480a3a6a10a7e4c5a9e1ce31a0ba7fb440f4`.

| Check | Result |
| --- | --- |
| Public snapshot | 3,058 entities, six locales |
| Determinism | Two independent image exports have identical manifests and all declared file hashes |
| Publication reachability | Every approved source entry is referenced by enabled release scenes or Resources dependencies |
| Unity Editor tests | 8 passed |
| Website and existing callback tests | 28 passed |
| Generated HTML | 18,499 pages |
| Complete artifact with game art and fonts | 19,915 files, approximately 189.6 MiB |
| Internal links and preserved original site files | Passed |
| Search benchmark | All six locales below 200ms; largest measured query approximately 16ms |
| Chrome smoke checks | CJK search, item filters, language switching, keyboard focus, 320px viewport, 200% text size and JavaScript-disabled reading passed |
| Release source changes | No tracked game data, localization, Resources, Packages or ProjectSettings changes |

Machine-readable results and preview screenshots are generated under ignored
`reports/`. Run `npm run verify` to regenerate the automated website results;
browser checks are documented in [wiki maintenance](wiki-maintenance.md).

On the developer's follow-up request, game images and UI sprites were approved:
1,356 unique PNG crops now serve 2,917 entity images. Five additional original
panel/button slices provide the web UI skin. Atlas source files are not published.
Silver and the game's fallback fonts are compressed to WOFF2, preserving all glyphs;
the six locales' current entity names and descriptions have no missing characters.
The image build passed the same website and Unity checks. Chrome additionally
verified all six locales' stat icons, the loaded Silver font, the homepage at
320px and text enlarged to twice its computed base size. Results are in `reports/`.

The subsequent typography correction was checked with a cold-cache Silver request
held for 3.5 seconds, an aborted font request, and normal navigation using the
browser cache. No temporary system font appeared during the held request, and the
failed request left readable content. A rendered Korean label's vertical center
error improved from -7.5px to -1.5px. List and detail ID labels were removed while
the source IDs and search lookup remained unchanged.

Common UI and data labels support all six
languages; specialized technical labels and authored rule explanations can retain
explicit English fallbacks. Six CSV/StringTable value differences were reported
locally; the release StringTables remain authoritative.

The Actions workflow is prepared but has not run remotely. No commit, push, Pages
source setting change or publication was performed. First publication remains a
separately authorized step after preview review, as required by the accepted plan
and repository README.
## Full-page review corrections — 2026-10-08

All nine review findings were addressed in the website projection: missing currency
relationships, per-pool shop counts, inherited slot capacity, variant names, long
skill lists, static Writing values, consistent skill categories, explicit special
table labels, and grouped related links with repeated reward contexts preserved.

- 52 callback/wiki tests passed, including seven focused review regression tests.
- Full Eleventy generation: 18,961 HTML pages across six locales.
- Internal link, asset and original-site preservation checks passed.
- HTML scan: no duplicate IDs, broken in-page anchors, unresolved placeholders,
  or untranslated English-only Korean table headings.
- Browser: source/use sections, three shop groups, inherited capacity, skill page
  navigation and Painting filters verified; all six Writing locales checked.
- 320px checks: no document overflow or broken images on Stealth, Painting, Gold,
  Ducarin shop and Spanish Commerce pages. Wide tables remain locally scrollable.

The original 0.56 import and game repository were not modified. Evidence is under
ignored `reports/wiki-review-*20261008*`; publication was not performed.
