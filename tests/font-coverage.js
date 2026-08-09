/* Which characters a shipped font file can actually draw.
 *
 * This is the second seam in the project, and the only one that isn't the
 * rendered page. It exists because missing glyphs are invisible to every
 * cheaper check: the author's Mac has Chinese fonts to fall back on, so a
 * subset that lost a character still *looks* right locally, and the browser's
 * own document.fonts API reports what was declared, not what the file
 * contains. The only honest answer comes from reading the file.
 */

import { readFile } from "node:fs/promises";
import woff2 from "wawoff2";

const u16 = (b, o) => b.readUInt16BE(o);
const u32 = (b, o) => b.readUInt32BE(o);

/* The cmap subtable formats a real font in 2026 actually uses: 12 for
 * anything beyond the BMP, 4 for everything older. Nothing else is worth
 * supporting — if a font turns up using format 6, the right response is to
 * find out why, not to quietly handle it. */
const readFormat4 = (b, o, out) => {
  const segCount = u16(b, o + 6) / 2;
  const ends = o + 14;
  const starts = ends + segCount * 2 + 2;
  const deltas = starts + segCount * 2;
  const ranges = deltas + segCount * 2;

  for (let s = 0; s < segCount; s++) {
    const end = u16(b, ends + s * 2);
    const start = u16(b, starts + s * 2);
    if (start === 0xffff) continue;
    const delta = u16(b, deltas + s * 2);
    const rangeOffset = u16(b, ranges + s * 2);

    for (let c = start; c <= end; c++) {
      let glyph;
      if (rangeOffset === 0) {
        glyph = (c + delta) & 0xffff;
      } else {
        const at = ranges + s * 2 + rangeOffset + (c - start) * 2;
        if (at + 1 >= b.length) continue;
        glyph = u16(b, at);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) out.add(c);
    }
  }
};

const readFormat12 = (b, o, out) => {
  const groups = u32(b, o + 12);
  for (let g = 0; g < groups; g++) {
    const at = o + 16 + g * 12;
    const start = u32(b, at);
    const end = u32(b, at + 4);
    for (let c = start; c <= end; c++) out.add(c);
  }
};

export const coveredCodepoints = async (path) => {
  const ttf = Buffer.from(await woff2.decompress(await readFile(path)));

  let cmap = null;
  const tableCount = u16(ttf, 4);
  for (let t = 0; t < tableCount; t++) {
    const rec = 12 + t * 16;
    if (ttf.toString("ascii", rec, rec + 4) === "cmap") cmap = u32(ttf, rec + 8);
  }
  if (cmap === null) throw new Error(`${path} has no cmap table`);

  const covered = new Set();
  const subtables = u16(ttf, cmap + 2);
  for (let s = 0; s < subtables; s++) {
    const at = cmap + 4 + s * 8;
    const offset = cmap + u32(ttf, at + 4);
    const format = u16(ttf, offset);
    if (format === 4) readFormat4(ttf, offset, covered);
    if (format === 12) readFormat12(ttf, offset, covered);
  }

  if (covered.size === 0) throw new Error(`${path}: no readable cmap subtable`);
  return covered;
};
