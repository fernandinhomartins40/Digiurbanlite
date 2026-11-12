/* Run: node digiurban/mobile/scripts/make-store-images.js
 * AI generated only the background masters; screenshots are read exclusively
 * from capturas/. No crop, retouch, repaint, device frame or text replacement.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '../store-assets');
const FINAL = path.join(ROOT, 'final');
const SUPPORT = path.join(ROOT, 'support');
const FONT = path.join(SUPPORT, 'fonts/Nunito.ttf');
const SCREENS = [
  ['01-entrada', ['Escolha sua cidade', 'e entre com seu CPF']],
  ['02-cadastro', ['Crie sua conta', 'em poucos minutos']],
  ['03-conferir-documento', ['Confira se um documento', 'é autêntico']],
  ['04-esqueci-senha', ['Recupere o acesso', 'pelo seu e-mail']],
  ['05-ajuda', ['Ajuda sempre', 'à mão']],
  ['06-excluir-conta', ['Seus dados,', 'suas regras']],
  ['07-sem-internet', ['Avisa quando você fica', 'sem internet']],
  // Telas com login (conta de teste da revisão), só iPhone; reaproveitam fundos já gerados
  ['10-inicio', ['Diga do que precisa', 'e ache o serviço'], '01-entrada'],
  ['11-servicos', ['Centenas de serviços', 'da sua prefeitura'], '02-cadastro'],
  ['13-meus-pedidos', ['Acompanhe seus pedidos', 'em cada etapa'], '04-esqueci-senha'],
  ['15-assistente', ['Um assistente', 'para te ajudar'], '05-ajuda'],
];
const PLATFORMS = [
  // At 78%, the 1080x2400 source would occupy 1872 of 1920 pixels.
  // Compact title approved by user; 72% preserves full content and legibility.
  { prefix: 'play', source: 'android', width: 1080, height: 1920, fraction: 0.72, bottom: 24, textTop: 23, fontSize: 60, radius: 24 },
  { prefix: 'ios', source: 'ios', width: 1320, height: 2868, fraction: 0.78, bottom: 60, textTop: 165, fontSize: 91, radius: 34 },
];
const PROTECTED = {
  'play-icon-512.png': '31ca86f1b10768e9b7e9bfc01eaca44507e9e62639c852a0adf98719d0fc5bdf',
  'play-feature-1024x500.png': '1fff0dfc26c9dd93c7cec83ad40e515ed94deccd92cdbb042d59a2b0d535ff5f',
};
const hash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function renderHeadline(lines, p) {
  const images = [];
  let top = p.textTop;
  const lineGap = p.prefix === 'play' ? 6 : 14;
  for (let i = 0; i < lines.length; i++) {
    const color = i === lines.length - 1 ? '#00efcf' : '#ffffff';
    // Pango + supplied font keeps spelling/accents deterministic and portable.
    const rendered = await sharp({ text: {
      text: `<span foreground="${color}" weight="heavy">${escape(lines[i])}</span>`,
      font: `Nunito Heavy ${p.fontSize}`, fontfile: FONT,
      dpi: 72, rgba: true,
    } }).png().toBuffer({ resolveWithObject: true });
    assert(rendered.info.width < p.width - 64, 'Headline exceeds safe width');
    images.push({ input: rendered.data, left: Math.round((p.width - rendered.info.width) / 2), top });
    top += rendered.info.height + lineGap;
  }
  return { images, bottom: top - lineGap };
}

async function compose(p, name, lines, master = name) {
  const sourceFile = path.join(ROOT, 'capturas', p.source, `${name}.png`);
  try { await fs.access(sourceFile); } catch (err) {
    if (err.code === 'ENOENT' && (p.prefix === 'ios' ? ['02-cadastro', '07-sem-internet'] : ['10-inicio', '11-servicos', '13-meus-pedidos', '15-assistente']).includes(name)) return null;
    throw err;
  }
  const original = await fs.readFile(sourceFile);
  const inputHash = hash(original);
  const sourceMeta = await sharp(original).metadata();
  const expected = p.prefix === 'play' ? [1080, 2400] : [1320, 2868];
  assert.deepEqual([sourceMeta.width, sourceMeta.height], expected, `Unexpected source dimensions: ${name}`);

  const width = Math.round(p.width * p.fraction);
  // Specifying width only preserves aspect ratio. No extract or cover on input.
  const resized = await sharp(original).resize({ width, kernel: 'lanczos3' })
    .toColourspace('srgb').removeAlpha().png().toBuffer({ resolveWithObject: true });
  const height = resized.info.height;
  const left = Math.round((p.width - width) / 2);
  const top = p.height - p.bottom - height;
  const headline = await renderHeadline(lines, p);
  assert(headline.bottom + 18 < top, `Headline overlaps screenshot: ${name}`);
  assert(top >= 0 && top + height <= p.height, 'Screenshot must be fully on canvas');

  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${p.radius}" fill="white"/></svg>`);
  const rounded = await sharp(resized.data).ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const spread = 42;
  const shadow = await sharp({ create: {
    width: width + spread * 2, height: height + spread * 2,
    channels: 4, background: '#00000000',
  } }).composite([{ input: Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${p.radius}" fill="#000922" fill-opacity="0.45"/></svg>`), left: spread, top: spread }])
    .blur(16).png().toBuffer();

  // Only decorative artwork is cropped to fit the final store aspect ratio.
  const background = await sharp(path.join(SUPPORT, 'masters', `${master}.png`))
    .resize(p.width, p.height, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#011552' }).removeAlpha().png().toBuffer();
  const supportFile = path.join(SUPPORT, `${p.prefix}-${name}-background.png`);
  const support = await sharp(background).composite(headline.images).removeAlpha().png().toBuffer();
  await fs.writeFile(supportFile, support);

  // Shadow may run beyond bottom canvas: clip SHADOW only, never screenshot.
  const shadowLeft = left - spread;
  const shadowTop = top - spread + 10;
  const shadowHeight = Math.min(height + spread * 2, p.height - shadowTop);
  const croppedShadow = await sharp(shadow).extract({ left: 0, top: 0, width: width + spread * 2, height: shadowHeight }).png().toBuffer();
  const filename = `${p.prefix}-${name}.png`;
  const outputFile = path.join(FINAL, filename);
  await sharp(support).composite([
    { input: croppedShadow, left: shadowLeft, top: shadowTop },
    { input: rounded, left, top },
  ]).flatten({ background: '#011552' }).removeAlpha().png().toFile(outputFile);

  // Pixel-for-pixel equality inside rounded edges proves source preservation.
  const inset = p.radius + 2;
  const inner = { left: inset, top: inset, width: width - inset * 2, height: height - inset * 2 };
  const a = await sharp(resized.data).extract(inner).removeAlpha().raw().toBuffer();
  const b = await sharp(outputFile).extract({ ...inner, left: left + inset, top: top + inset }).removeAlpha().raw().toBuffer();
  assert(a.equals(b), `Screenshot pixels changed: ${filename}`);
  assert.equal(hash(await fs.readFile(sourceFile)), inputHash, 'Source file changed');
  return {
    file: filename, headline: lines.join(' '), source: path.relative(ROOT, sourceFile),
    sourceSha256: inputHash, screenshotBounds: { left, top, width, height },
    screenshotWidthPercent: Number((width / p.width * 100).toFixed(2)),
    screenshotInteriorMatchesResizedSource: true, support: path.relative(ROOT, supportFile),
  };
}

async function inventory() {
  const rows = [];
  for (const file of (await fs.readdir(FINAL)).filter(n => /\.(png|jpe?g)$/i.test(n)).sort()) {
    const full = path.join(FINAL, file);
    const m = await sharp(full).metadata();
    let transparentPixels = false;
    if (m.hasAlpha) {
      const stats = await sharp(full).stats();
      transparentPixels = stats.channels[m.channels - 1].min < 255;
    }
    assert(!transparentPixels, `Transparency found: ${file}`);
    if (/^(play|ios)-\d\d-/.test(file)) assert(!m.hasAlpha && m.channels === 3, `Expected RGB: ${file}`);
    const playRatioOK = file.startsWith('play-') && file !== 'play-feature-1024x500.png'
      ? Math.max(m.width, m.height) <= 2 * Math.min(m.width, m.height) : null;
    if (playRatioOK !== null) assert(playRatioOK, `Play aspect ratio invalid: ${file}`);
    rows.push({ file, width: m.width, height: m.height, channels: m.channels,
      hasAlphaChannel: m.hasAlpha, transparentPixels, playScreenshotRatioOK: playRatioOK });
  }
  return rows;
}

async function main() {
  await fs.mkdir(FINAL, { recursive: true });
  const sources = {};
  for (const dir of ['android', 'ios']) for (const name of await fs.readdir(path.join(ROOT, 'capturas', dir))) {
    sources[`${dir}/${name}`] = hash(await fs.readFile(path.join(ROOT, 'capturas', dir, name)));
  }
  for (const [name, expected] of Object.entries(PROTECTED)) assert.equal(hash(await fs.readFile(path.join(FINAL, name))), expected, `Protected asset changed: ${name}`);
  const compositions = [];
  for (const p of PLATFORMS) for (const [name, lines, master] of SCREENS) {
    const row = await compose(p, name, lines, master);
    if (row) { compositions.push(row); console.log(`Created ${row.file}`); }
  }
  assert.equal(compositions.length, 16);
  for (const [file, expected] of Object.entries(sources)) assert.equal(hash(await fs.readFile(path.join(ROOT, 'capturas', file))), expected);
  for (const [file, expected] of Object.entries(PROTECTED)) assert.equal(hash(await fs.readFile(path.join(FINAL, file))), expected);
  const files = await inventory();
  await fs.writeFile(path.join(ROOT, 'validation-report.json'), JSON.stringify({
    sourceFilesUnchanged: true, protectedAssetsUnchanged: true,
    notes: 'Play screenshot width 72% to fit full capture plus compact heading; iOS 78%. Existing icon has an entirely opaque alpha channel. Feature graphic is exempt from screenshot ratio rule.',
    compositions, files,
  }, null, 2) + '\n');
  console.table(files.map(r => ({ file: r.file, size: `${r.width}x${r.height}`, transparency: r.transparentPixels ? 'YES' : 'none', channels: r.channels, playRatio: r.playScreenshotRatioOK ?? 'N/A' })));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
