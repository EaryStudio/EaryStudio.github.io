# Wiki update: game release 0.57

Source: `12ae9600ef534462fe440c2a1fa78b01cfd5168f` (full/Android build profiles: 0.57).
Previous snapshot: `fd02bba2d2e4e677e39a0334461c3a9d61d5f0ee` (0.56).
Exporter: 1.3.1. Export package: `0.57-12ae9600-20261009-final`.

## Changes

- Added the game's 0.57 patch notes in all six languages, including the life-skill
  level-cap indicator, slot-ticket purchase limits and start-screen wiki link.
- Exported the slot-ticket purchase policy from the release code and MainScene:
  inventory 450, battle rewards 18, equipment loadouts 9 maximum total slots.
  Owned tickets count toward purchase limits. This is a purchase restriction,
  not a restriction on receiving reward tickets.
- Displayed this policy on the three ticket pages, six related offer pages and
  their shop tables. Existing item and offer values come from the Unity export.
- Retained existing public IDs, URLs and images. The package now contains 3,082
  entities, with one addition and no removals.

The importer reports 143 changed existing entities: nine ticket/offer records,
23 historical patch-note ordering fields, and 111 objectives whose empty optional
fields were normalized by Unity (`null` to empty string/list). The objective
conditions and rewards did not change. These are not 143 balance changes.
Existing entity names/descriptions and image bytes are unchanged.

## Verification

- Unity Editor Wiki tests: 31 passed, including cold/warm Unity deserialization of
  empty objective fields. The exporter canonicalizes these optional fields without
  mutating game assets.
- Website/callback tests: 58 passed, including six-language purchase-limit rendering.
- Snapshot validation: schemas, file hashes, references and all six locales passed.
- Two final exports produced identical manifests and all 1,386 package files.
- The export ran in a detached checkout of the source revision, with only the
  publication profile and Editor exporter updates applied. No player save was read.
- The Pages workflow runs the complete static build, internal-link checks and
  original-site preservation checks before deployment. Android association files
  remain included in the Pages archive.

For subsequent patches, follow [wiki maintenance](wiki-maintenance.md). Exporter
and publication-profile changes are tracked separately in the game repository;
the website's CI uses this committed public snapshot without accessing Unity.
