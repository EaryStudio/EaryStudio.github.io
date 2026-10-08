"""Convert the release's unchanged game fonts to WOFF2 (fonttools[woff] 4.61.1).

Run manually when game fonts change: python scripts/wiki/export-fonts.py RELEASE_ROOT
The website build uses the committed WOFF2 files; it never needs Python or Unity.
"""
import hashlib
import json
from pathlib import Path
import shutil
import sys
from fontTools.ttLib import TTFont

game = Path(sys.argv[1]).resolve()
output = Path(__file__).resolve().parents[2] / 'assets/fonts/game'
output.mkdir(parents=True, exist_ok=True)
sources = {
    'silver': 'Assets/Font/Silver.ttf',
    'fusion-hans': 'Assets/Font/Localization/Sources/fusion-pixel-12px-proportional-zh_hans.ttf',
    'fusion-hant': 'Assets/Font/Localization/Sources/fusion-pixel-12px-proportional-zh_hant.ttf',
    'unifont': 'Assets/Font/Localization/Sources/unifont-17.0.05.otf',
}
report = {}
for name, relative in sources.items():
    source = game / relative
    font = TTFont(source, recalcTimestamp=False)
    font.flavor = 'woff2'
    destination = output / (name + '.woff2')
    font.save(destination)
    report[name] = {'source': relative, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                    'woff2Sha256': hashlib.sha256(destination.read_bytes()).hexdigest(), 'bytes': destination.stat().st_size}
    print(name, destination.stat().st_size, 'bytes;', len(font.getBestCmap()), 'characters')
shutil.copytree(game / 'Assets/Font/Localization/Licenses', output / 'licenses',
                dirs_exist_ok=True, ignore=shutil.ignore_patterns('*.meta'))
(output / 'sources.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
