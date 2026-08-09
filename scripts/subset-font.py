"""Rebuild the Chinese subset font.

Run this whenever any Chinese text on the site changes:

    pip install fonttools brotli
    curl -sLO https://github.com/notofonts/noto-cjk/raw/main/Serif/SubsetOTF/TC/NotoSerifTC-Regular.otf
    python3 scripts/subset-font.py NotoSerifTC-Regular.otf

Why a subset at all: the full Traditional Chinese face is ~8MB. These pages
use a few dozen characters. Shipping only those turns "self-host the Chinese
type" from an absurd idea into a file smaller than the Latin one.

Why the character list is derived rather than maintained: a hand-kept list is
a second copy of the site's own text, and the two drift. This reads the real
sources instead, so the only way to get it wrong is to not run the script —
which is precisely what the missing-glyph test in the suite exists to catch.

The source .otf is deliberately NOT committed. It is 8MB of input to a
one-off, reproducible step; the output is what the site serves.
"""

import re
import sys
from pathlib import Path

from fontTools.subset import main as subset

ROOT = Path(__file__).resolve().parent.parent

# Every file that can contain Chinese the visitor will see: the page itself,
# the exits data, and the CSS content labels ("聯絡", "即將").
SOURCES = ["zh/index.html", "index.html", "404.html", "main.js", "styles.css"]

OUT = ROOT / "fonts" / "noto-serif-tc-subset.woff2"


def characters() -> str:
    """Every non-ASCII character appearing anywhere in the sources.

    A superset of what is strictly rendered — comments and metadata are
    swept in too. That is the safe direction to be wrong in: a handful of
    extra glyphs costs bytes, a missing one costs a visible tofu box.
    """
    seen = set()
    for name in SOURCES:
        text = (ROOT / name).read_text(encoding="utf-8")
        seen.update(c for c in text if ord(c) > 0x7F)
    return "".join(sorted(seen))


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(f"usage: {sys.argv[0]} <path to NotoSerifTC-Regular.otf>")

    chars = characters()
    print(f"{len(chars)} characters: {chars}")

    subset([
        sys.argv[1],
        f"--text={chars}",
        "--flavor=woff2",
        f"--output-file={OUT}",
        # Layout features the page never triggers, dropped rather than carried.
        "--layout-features=",
        "--no-hinting",
        "--desubroutinize",
    ])
    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
