# Eary Studio

Official English homepage: https://earystudio.github.io/
Six-language Iris’s Idle Log wiki: https://earystudio.github.io/iris/wiki/

Featured game: **Iris’s Idle Log**, Steam Full AppID **5062420**. Android package:
`com.earystudio.irissidlelog`. Contact: earystudio@gmail.com.

The homepage uses HTML, CSS, and a small callback script. Eleventy generates the
wiki and preserves the original public paths. No analytics, site cookies, remote
fonts, embedded video, or service worker. The existing
[Press Kit](https://drive.google.com/drive/folders/1_2j7zdcYDuD3dST7jrg1R6I6BNgDSDdI?usp=drive_link)
is linked, not recreated. External services load only when their links are followed.

## Repository guard

Before any edit, commit, push, or setting change, run `git remote -v`,
`git branch --show-current`, and `git status --short`. Origin must identify exactly
**EaryStudio/EaryStudio.github.io**. Use the **EaryStudio** GitHub account/connection
for remote mutations. Stop on a mismatch. Never use a Unity repository or another
game-development account for this website.

## Preview and checks

From the repository root (Python 3; Node.js 18 or newer for the tests):

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/ rather than a file URL; assets use root-relative paths.
Python’s server does not automatically serve the custom 404; preview `/404.html`
directly and check real missing paths after deployment.

```powershell
node --test tests/callback.test.cjs
git diff --check
```

Check 1920×1080, 1366×768, 768×1024, 390×844, and 320 px width; 200% zoom; keyboard
navigation/focus; metadata; image/store/Press/email links; and the page without
JavaScript. Callback tests use synthetic values only. Never put a real token in
terminal commands, screenshots, fixtures, issues, or logs.

## Maintenance

Main content and metadata: `index.html`. Styles: `css/site.css`. Not-found page:
`404.html`. Callback: the three files in `steam-auth/`. Manual transfer flags:
`config/iris-transfer.json` (production), `config/iris-transfer-qa.json` (internal QA).
The legacy `iris.json` / `iris-qa.json` flags do not control the manual transfer release.

Steam was rechecked on September 18, 2026: **not yet available**, planned Q4 2026.
Use **Wishlist on Steam** now; recheck before publication and use **View on Steam**
after release. Do not advertise Cross Save before its separate release gates pass.

The [Google Play developer page](https://play.google.com/store/apps/dev?id=9073169014574442680)
listed Iris and three other games on that date. Their package IDs were discovered
from that page, not guessed:

| Game | Package |
| --- | --- |
| Hell’s Diner The Solo Feast | `com.EaryStudio.HellsDinerTheSoloFeast` |
| Stack The Numbers | `com.EaryStudio.StackTheNumbers` |
| Ariom - Rhythm Game on Clock | `com.EaryStudio.Ariom` |

Recheck the catalogue when updating it. Keep Iris featured and all site copy English.
The external existing game policy is bilingual and is labeled as the game’s policy.

## Asset sources

Typography uses locally hosted **Silver**, the same pixel font used by the game,
by [Poppy Works](https://poppyworks.itch.io/silver). WOFF2 files, attribution, source
hashes and the game's CJK fallback font licenses are included in `assets/fonts/game/`.
The earlier Pixelify Sans files remain available for historical pages.
No third-party font request is made. `assets/icons/eary-studio-logo.png` is the
unchanged official logo supplied by Eary (`Eary studio Logo large.png`) for the
About section, displayed proportionally at 128×128. The earlier channel avatar
was replaced at Eary’s request; the white logo variant is not used on this light page.
Discord and the YouTube, X, and Steam developer links were supplied by Eary.

Only selected official web assets were copied. Drive contents were not changed.
Public Press Kit and image previews were verified while signed out. Do not hotlink
Drive previews or generate substitute artwork.

| Local asset | Original source |
| --- | --- |
| `iris-hero-960.webp`, `iris-hero-1920.webp` | [KeyArt_1920x1080(ENG).png](https://drive.google.com/file/d/1bBS4jfgXerPQIS10Nhh9ZlfpJeNgrvms/view) |
| `iris-equipment.webp` | [Screenshots/ENGLISH/0001_english.png](https://drive.google.com/file/d/1RJFJl_ms097jPdYdQBQ-NY5FZzToSWE0/view) |
| `iris-combat.webp` | [Screenshots/ENGLISH/0002_english.png](https://drive.google.com/file/d/1njNOnuXwVDIAd0dPCFH7wAPvuGC1zTXG/view) |
| `iris-story.webp` | [Screenshots/ENGLISH/0003_english.png](https://drive.google.com/file/d/1noDWheHtVq9nZ1wNRX7GCuu3iZrUkNKH/view) |
| `iris-desktop-960.webp`, `iris-desktop-1920.webp` | [Screenshots/ENGLISH/0005_english.png](https://drive.google.com/file/d/1OWX2-Fcw1nKgA9hmnsgLMbRU3ileQ-RG/view) |
| `iris-social.png` | [TrailerThumbnail_1920x1080(ENG).png](https://drive.google.com/file/d/110nk6bMwqwCF_oEj_esCG5vLJ0F-2zkx/view) |
| `hells-diner.webp` | Main icon from [Hell’s Diner’s listing](https://play.google.com/store/apps/details?id=com.EaryStudio.HellsDinerTheSoloFeast) |
| `stack-the-numbers.webp` | Main icon from [Stack The Numbers’ listing](https://play.google.com/store/apps/details?id=com.EaryStudio.StackTheNumbers) |
| `ariom.webp` | Main icon from [Ariom’s listing](https://play.google.com/store/apps/details?id=com.EaryStudio.Ariom) |
| Favicons and Apple touch icon | Main icon from [Iris’s listing](https://play.google.com/store/apps/details?id=com.earystudio.irissidlelog) |

The three 1920×1080 screenshot sources were cropped to `(1340, 0, 1920, 1032)`
(left, top, right-exclusive, bottom-exclusive). This preserves the entire 580×1032
game window and removes only wallpaper/taskbar. The desktop example is uncropped.
Hero/desktop use lossless WebP; 960×540 variants use exact half-size nearest-neighbor
sampling. The full hero is 32,684 bytes versus 103,998 bytes for optimized PNG.
Listing icons retain 240×240 dimensions. Favicons use Lanczos resizing. The social
thumbnail is fitted at 1120×630 in a 1200×630 canvas with 40 px solid `#F7F3EA`
margins on each side. No artwork is reconstructed or repainted.

## Publication

Publish reviewed changes only with an authorized push. The first wiki publication
and Pages source switch were authorized on 2026-10-08. Deployment configuration:

- Settings → Pages → **GitHub Actions**.
- Custom domain blank; HTTPS enforced.
- `.github/workflows/pages.yml` verifies and builds `main`, then deploys `_site`.
- Preserve `.nojekyll`, authentication callbacks, config and `.well-known` files.

PRs run the same verification without deploying. A failed build leaves the previous
deployment serving. Roll back by reverting the website change and redeploying
through the same workflow. README and tests are public source documents.

After deployment verify HTTP status, content type, and cache headers for `/`,
`/config/iris.json`, and `/steam-auth/`; all images/styles; external links; a nested
missing URL returning the custom 404; and no third-party page-load requests.
Production config must still be **false/false/1**. Python’s local headers do not
represent GitHub’s headers. See [Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## PC 정식 출시 전 수동 데이터 전달 체크리스트

이 기능은 PC↔모바일 **자동 동기화가 아닙니다**. 사용자가 **보내기/가져오기**를
요청할 때만 진행 데이터를 전달합니다.

### 설정 파일 구분

| 파일 (`config/` 아래) | 용도 |
| --- | --- |
| `iris-transfer.json` | 일반 사용자용 수동 데이터 전달 설정 |
| `iris-transfer-qa.json` | 내부 테스트용 수동 데이터 전달 설정 |
| `iris.json` / `iris-qa.json` | 예전 자동 Cross Save 설정. 이번 수동 전달 기능 공개에는 사용하지 않음 |

일반 사용자용 주소: **https://earystudio.github.io/config/iris-transfer.json**

PC 출시 전 초기 설정은 다음과 같이 유지합니다. 이번 사이트 설정 추가 작업에서는
기능을 활성화하지 않습니다.

```json
{
  "manualTransferEnabled": false,
  "manualTransferMaintenance": false,
  "configVersion": 1
}
```

### 출시 및 공개 확인

- [ ] PC 정식 출시 전에는 `iris-transfer.json`의 `manualTransferEnabled=false`를 유지합니다.
- [ ] 일반 배포용 Android·Steam Full 빌드에서 PC→모바일 및 모바일→PC의
  보내기/가져오기를 검증합니다. 내부 QA 빌드 검증만으로 이 항목을 완료하지 않습니다.
- [ ] 기능 공개가 승인되면 `iris-transfer.json`의 **`manualTransferEnabled`만 `true`로**
  변경합니다. 정상 공개 시 `manualTransferMaintenance=false`, `configVersion=1`은 유지합니다.
- [ ] 커밋·푸시 후 GitHub Pages 배포 성공을 확인하고, 위 공개 주소에서 HTTP 200과
  실제 JSON 값을 확인합니다. 활성화 배포의 기대값은 `true/false/1`입니다.
- [ ] 활성화 배포 후 일반 배포용 Android 앱에서 **Full 구매자의 연동 메뉴 표시**를
  실제 기기로 확인합니다. 사이트 JSON 배포 성공만으로 앱 검증을 완료한 것으로 간주하지 않습니다.

### 긴급 중단

일반 사용자용 수동 전달을 긴급 중단하려면 `iris-transfer.json`의
**`manualTransferMaintenance=true`**로 설정하고 커밋·푸시한 뒤 실제 공개 응답을 확인합니다.
캐시와 클라이언트의 설정 재조회 시점 때문에 즉시 모든 기기에 반영된다고 가정하지 않습니다.

내부 테스트용 설정과 일반 사용자용 설정은 별개입니다. 이번 기능 공개를 위해
`iris-transfer-qa.json`, `iris.json`, `iris-qa.json`을 변경하지 않습니다.
기존 `.nojekyll`과 다른 설정 파일도 유지합니다.

## Legacy automatic Cross Save / historical Unity handoff

This section and its Cross Save QA subsection describe the previous automatic
Cross Save configuration. They are retained as historical reference, not as the
activation procedure for manual data transfer. Use the manual transfer checklist
and `iris-transfer.json` above for the current public release.

Exact URL: **https://earystudio.github.io/config/iris.json**

Initial values: `crossSaveEnabled=false`, `crossSaveMaintenance=false`,
`configVersion=1`. These are public operational flags, not security or ownership
checks. Do not add authentication to this endpoint.

The later Unity client must require valid JSON, actual boolean flags, a supported
integer schema version, enabled true, and maintenance false. Missing/wrong fields,
malformed JSON, unsupported versions, HTTP errors, or timeout disable Cross Save.
Never fall back to persisted enabled state. Android gameplay and GPGS saving remain
independent. Config version changes only for schema changes, not flag toggles.

Proposed client policy: 5-second timeout; fetch on entering/resuming Cross Save;
revalidate before transfers if the last successful fetch is older than 60 seconds.
Use HTTP revalidation and `?t=<unix-seconds>` to reduce stale caching. A query is
not a guaranteed CDN purge. Do not use schema version alone as a cache-buster.

Observed homepage cache lifetime on September 18, 2026: 600 seconds. Check the
actual config response after deployment. Publication and caching are separate
delays; do not promise an instant switch or universal deadline. [GitHub’s quickstart](https://docs.github.com/en/pages/quickstart)
describes up to 10 minutes for publication after a push.

Operations: edit JSON → validate → commit → push → wait for Pages success → fetch
the public JSON → verify on a representative device/network.

Release gates: Steam Full version ready; Valve settings confirmed; released Android
integration; save compatibility/conflict tests passed; privacy reviewed; user
approval to enable. Then set enabled true, maintenance false, and verify propagation
before announcing availability. Test toggle behavior with fixtures, not production.

Emergency: publish maintenance true. Clients stop starting operations after seeing
it; active uploads still complete required batch cleanup. For longer withdrawal
also set enabled false. Restore only after resolving the issue.

### Cross Save QA channel

The dedicated Android internal-testing and Windows Full `main_qa` builds read
**https://earystudio.github.io/config/iris-qa.json**. Its initial values are
`crossSaveEnabled=true`, `crossSaveMaintenance=false`, `configVersion=1`.
The production `iris.json` remains disabled.

Unity selects this URL with the build-only `CROSS_SAVE_QA` symbol in the dedicated
QA Build Profiles. Installing from a Play track or selecting a Steam beta branch
does not change an existing binary's channel. Demo is excluded even if the symbol
is accidentally present. QA still requires Full access, Valve OAuth configuration,
valid fresh remote config, and maintenance false; it does not bypass these checks.

These are public feature flags, not tester authentication. Restrict distribution
through Play internal testing and Steam QA access. QA uses the same save paths,
AppID, and real Steam Cloud files; use QA accounts and backed-up saves.
Do not promote a QA binary to production: rebuild with the normal profile.
To pause QA, set maintenance true in `iris-qa.json`; to pause both channels,
set it in both JSON files. Each channel observes its own maintenance flag.

## Steam callback / Android handoff

Exact redirect: **https://earystudio.github.io/steam-auth/**

The website does not initiate OAuth or authenticate users. Android owns sign-in
through an external browser, preferably Auth Tab. Capture the HTTPS callback
directly in Android. Custom Tabs fallback receives the verified App Link intent.
Handle cold/warm starts and deduplicate delivery: a later tab-close cancellation
must not overwrite a completed result. No custom scheme or JavaScript relay.

The static page only classifies a response, synchronously clears query/fragment,
and renders fixed guidance. It cannot verify app-private state or prove success.
No credentials enter DOM, storage, logs, network requests, or history state.
URL cleanup does not guarantee erasure from browser/device history or extensions.
A query credential would already have reached the host; never construct such URLs.
With JavaScript disabled, cleanup cannot run and the page instructs the user to close
the tab and retry. The callback meta CSP disallows connections/forms/external scripts.
GitHub Pages does not provide arbitrary per-page headers; meta CSP cannot implement
unsupported `frame-ancestors` protection.

### Native implementation contract and device QA

- Generate 32 cryptographically random bytes for state. Keep one pending attempt
  in app-private storage with 10-minute expiry and single use.
- Check HTTPS, exact host/path, matching state, and response shape. Reject duplicate
  fields, malformed escapes, simultaneous success/error, unsolicited/replayed results.
- A success candidate has a nonempty opaque token and `token_type=steam`. Do not
  assume token length or trust deprecated `steamid` response data.
- Matching `access_denied` maps to denial. Browser close is local cancellation;
  Steam may send no callback. Verification failure/timeouts accept no credential.
- Keep the token in native secure storage; pass only normalized result status to Unity.
  Never log full URIs. Clear pending state on completion/cancel/timeout/replacement.
- Protect credentials using Android platform-backed storage, excluded from backups
  and logs; not ordinary Unity preferences. Validate access with a read-only cloud
  request before showing connected.
- Confirmed expiry/revocation clears credentials and prompts explicit sign-in.
  Network failure is not proof of revocation. Use Valve’s issued expiry policy;
  do not invent `expires_in`, refresh tokens, or silent renewal.
- State correlates attempts; it is not a signed identity assertion. Save formats,
  conflicts, filenames, quotas, and PC Steam Cloud setup belong to the Unity task.

### Android website association

`.well-known/assetlinks.json` contains the Play app-signing certificate fingerprint
provided by the developer on 2026-09-26 (not the upload certificate):

```text
06:26:C6:3D:99:44:88:4E:5C:C4:0D:58:F1:04:01:E6:C3:4A:CA:21:9F:A1:09:3A:B2:AA:37:D5:57:58:47:5B
```

Namespace: `android_app`; package: `com.earystudio.irissidlelog`;
relation: `delegate_permission/common.handle_all_urls`.
Include legitimate key-rotation fingerprints when needed; never add a development
signing key to production associations. Fingerprints are public metadata, not keys.

Restrict Android's manifest to host `earystudio.github.io`, exact `/steam-auth/`
path. Serve association JSON over HTTPS with no redirect. The existing empty
`.nojekyll` preserves the dot-prefixed directory. Verify the deployed endpoint,
then test actual App Link verification and Auth Tab/Custom Tabs return with an app
delivered through Play using this signing certificate. A locally installed APK
with a different signer is not covered by this association.

### Valve gate and credential boundaries

Valve documents `response_type=token` with fragment delivery and mentions code mode.
Modern OAuth prefers code + PKCE. Ask Valve for documented public-native PKCE support
before changing the documented token flow. The approval reply does not confirm PKCE.
Never invent exchange endpoints. If a secret
is required, revisit architecture first. Cross Save stays disabled meanwhile.

ICloudService supports non-Steam cross-platform saves; its documented file methods
take the user’s token without a listed publisher key. No backend requirement is
established for those operations. An API requiring a publisher key must run on a
trusted server. Do not add one solely for ownership checks. Inspect `x-eresult`,
not just HTTP 200; complete upload batches even after failures.

Public: AppID, package, URLs, feature flags, signing fingerprints, issued Client ID
subject to issuance terms. Never commit OAuth secrets, access/refresh tokens,
Publisher Web API keys, private credentials, or user auth data.

References: [Steam OAuth](https://partner.steamgames.com/doc/webapi_overview/oauth),
[ICloudService](https://partner.steamgames.com/doc/webapi/ICloudService),
[Steam Cloud](https://partner.steamgames.com/doc/features/cloud),
[Auth Tab](https://developer.chrome.com/docs/android/custom-tabs/guide-auth-tab),
[Android association](https://developer.android.com/training/app-links/configure-assetlinks),
[Unity deep links](https://docs.unity3d.com/Manual/deep-linking.html),
[native OAuth](https://www.rfc-editor.org/info/rfc8252/),
[OAuth security](https://www.rfc-editor.org/info/rfc9700/).

## Valve approval — 2026-09-26

The developer supplied Steam Support's approval reply from Tavish: the requested
OAuth client profile has been created. This supersedes the old 30-day website draft
and the later 5-year request in the implementation plan.

| Setting | Value |
| --- | --- |
| Client ID | `3BD75E54` |
| Issued token lifetime | **1 year**, Valve's stated maximum |
| Full Game AppID | `5062420` |
| Android package | `com.earystudio.irissidlelog` |
| Requested Cloud scopes | `read_cloud`, `write_cloud`, scoped to the Full AppID |
| Redirect URI | `https://earystudio.github.io/steam-auth/` |

Unity now uses this public client ID and the documented `response_type=token` flow.
Token validity follows Valve's actual issuing/revocation policy. Do not infer a
refresh token, undocumented expiry field, or client-side 365-day validity guarantee.
The reply does not separately confirm PKCE support. Actual login, issued scopes,
redirect handling, and Cloud round trips still require release-signed device QA.

Keep `crossSaveEnabled=false`, `crossSaveMaintenance=false`, `configVersion=1`
until release readiness has been verified and public activation is authorized.
Client approval and website association do not enable public Cross Save themselves.

## External follow-up (separate authorization)

- Steamworks: set the dedicated store website field to the homepage after deploy.
  Review developer/publisher external website settings separately. Keep Press on
  the website; do not insert links into written descriptions or repurpose social fields.
- Google Play: Store settings → Store listing contact details → Website for all
  four games; update developer-page website separately where exposed. Preserve
  contact email and existing privacy-policy URLs.
- Privacy: review the existing game policy against actual Steam data handling
  before Cross Save release; it does not yet describe this integration. No claim
  is made that hosting has no logs or that the policy covers future functionality.
- Valve settings and the authentic signing association are now recorded. Validate
  the supported Android build for success/denial/cancel/replay/expiry,
  verification failures, unsupported browsers, and intact normal/GPGS gameplay.
- Enable only after readiness testing and user approval.

## Iris’s Idle Log wiki

The six-language 0.56 wiki is generated with Eleventy. See
[wiki maintenance](docs/wiki-maintenance.md) for export/import, validation, preview,
publication review and rollback. Use Node.js 24 and `npm ci`, then `npm run verify`.
The game repository remains separate; this repository commits only its approved
public snapshot. Updates to `main` run verification and publish through GitHub
Actions after the authorized first publication.

## Future custom domain

Coordinate DNS, CNAME/Pages, HTTPS, canonical/social URLs, store links, Valve
redirect registration, Android callback/association host, and Unity config URLs.
Keep old installed clients working during migration. Do not assume a GitHub redirect
preserves OAuth or App Link verification. Adding CNAME alone is not a migration.


### 2026-09-27 Manual save transfer QA
The retired automatic protocol uses iris-qa.json with crossSaveEnabled=false and crossSaveMaintenance=true. Keep maintenance enabled even after enabling the new manual feature. The manual-only QA build reads config/iris-transfer-qa.json (manualTransferEnabled/manualTransferMaintenance/configVersion). It copies progress only on explicit Send/Import actions; it does not continuously synchronize devices. Production iris.json is unchanged. Enable the manual QA gate only for the validated new QA build.

