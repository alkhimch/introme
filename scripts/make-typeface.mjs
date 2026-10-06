// One-off: converts Josefin Sans (bold) into a three.js typeface JSON for the 3D name letters.
// Usage: node scripts/make-typeface.mjs
import fs from 'node:fs'
import opentype from 'opentype.js'

const src = 'node_modules/@fontsource/josefin-sans/files/josefin-sans-latin-700-normal.woff'
const out = 'public/fonts/josefin-bold.typeface.json'
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-·'

const buf = fs.readFileSync(src)
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
const round = Math.round
const scale = 100000 / ((font.unitsPerEm || 2048) * 72)
const glyphs = {}
for (const ch of chars) {
  const g = font.charToGlyph(ch)
  if (!g) continue
  const bb = g.getBoundingBox()
  let o = ''
  for (const c of g.path.commands) {
    const type = c.type === 'C' ? 'b' : c.type.toLowerCase()
    o += type + ' '
    if (c.x !== undefined) o += round(c.x * scale) + ' ' + round(c.y * scale) + ' '
    if (c.x1 !== undefined) o += round(c.x1 * scale) + ' ' + round(c.y1 * scale) + ' '
    if (c.x2 !== undefined) o += round(c.x2 * scale) + ' ' + round(c.y2 * scale) + ' '
  }
  glyphs[ch] = { ha: round(g.advanceWidth * scale), x_min: round(bb.x1 * scale), x_max: round(bb.x2 * scale), o }
}
fs.writeFileSync(out, JSON.stringify({
  glyphs,
  familyName: 'Josefin Sans Bold',
  ascender: round(font.ascender * scale),
  descender: round(font.descender * scale),
  underlinePosition: font.tables.post.underlinePosition,
  underlineThickness: font.tables.post.underlineThickness,
  boundingBox: { xMin: font.tables.head.xMin, xMax: font.tables.head.xMax, yMin: font.tables.head.yMin, yMax: font.tables.head.yMax },
  resolution: 1000,
}))
console.log('wrote', out, Object.keys(glyphs).length, 'glyphs', fs.statSync(out).size, 'bytes')
