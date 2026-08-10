"""Cut the shipped font files down to the characters this site draws.

    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    node scripts/build.js                 # refreshes fonts/characters.json
    .venv/bin/python scripts/subset-font.py ~/Downloads/noto-sources

Run it whenever any non-English text in i18n.js changes. The source faces are
deliberately NOT committed — they are tens of megabytes of input to a one-off,
reproducible step, and the outputs are what the site serves. Download them
into one directory first:

    NotoSerifSC-Regular.otf   github.com/notofonts/noto-cjk  Serif/SubsetOTF/SC
    NotoSerifJP-Regular.otf   github.com/notofonts/noto-cjk  Serif/SubsetOTF/JP
    NotoSerifKR-Regular.otf   github.com/notofonts/noto-cjk  Serif/SubsetOTF/KR
    NotoSerifTC-Regular.otf   github.com/notofonts/noto-cjk  Serif/SubsetOTF/TC
    NotoNaskhArabic-Regular.ttf   github.com/notofonts/notofonts.github.io

Two faces here are not built by this script and are not in the list above:

  eb-garamond-latin.woff2 and eb-garamond-cyrillic.woff2 are Google's own
  per-script builds of EB Garamond, downloaded as-is. Cutting them further
  would save a few kilobytes and cost the ability to add a word without
  regenerating anything.

Why the character list is derived rather than maintained: a hand-kept list is
a second copy of the site's own text, and the two drift. scripts/build.js
writes fonts/characters.json from i18n.js, this reads it, and the missing-glyph
test in the suite catches the case where neither was re-run.

Why a subset at all: a full Traditional Chinese face is ~8MB and these pages
use a few dozen characters each. Shipping only those turns "self-host the CJK
type" from an absurd idea into files smaller than the Latin one.
"""

import json
import sys
from pathlib import Path

from fontTools.subset import main as subset

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "fonts" / "characters.json"

# manifest key -> (source file name, output file name)
FACES = {
    "tc": ("NotoSerifTC-Regular.otf", "noto-serif-tc-subset.woff2"),
    "sc": ("NotoSerifSC-Regular.otf", "noto-serif-sc-subset.woff2"),
    "jp": ("NotoSerifJP-Regular.otf", "noto-serif-jp-subset.woff2"),
    "kr": ("NotoSerifKR-Regular.otf", "noto-serif-kr-subset.woff2"),
    "arabic": ("NotoNaskhArabic-Regular.ttf", "noto-naskh-arabic-subset.woff2"),
    # Han for the switcher comes from the Simplified face: it is the only one
    # of the four holding every character the ten language names need — 简 is
    # absent from both the Traditional and the Japanese face.
    "switcher-han": ("NotoSerifSC-Regular.otf", "switcher-han-subset.woff2"),
    "switcher-hangul": ("NotoSerifKR-Regular.otf", "switcher-hangul-subset.woff2"),
}


def main(sources: Path) -> None:
    characters = json.loads(MANIFEST.read_text())

    for key, (source_name, output_name) in FACES.items():
        wanted = characters.get(key, "")
        if not wanted:
            print(f"{key}: nothing to cut, skipped")
            continue

        source = sources / source_name
        if not source.exists():
            sys.exit(f"Missing source face: {source}")

        output = ROOT / "fonts" / output_name
        subset(
            [
                str(source),
                "--text=" + wanted,
                "--flavor=woff2",
                f"--output-file={output}",
                # Arabic is drawn by substitution, not by codepoint: drop the
                # layout tables and every letter renders in its isolated form.
                # The CJK faces don't need this and aren't harmed by it.
                "--layout-features=*",
                "--no-hinting",
                "--desubroutinize",
            ]
        )
        print(f"{output.relative_to(ROOT)}: {len(wanted)} characters, {output.stat().st_size:,} bytes")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(Path(sys.argv[1]).expanduser())
