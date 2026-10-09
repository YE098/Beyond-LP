#!/usr/bin/env node
// Requires sharp; BEYOND_SHARP_MODULE may point to an existing installation.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.BEYOND_SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const widths = [480, 800, 1200, 1600];

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || ['node_modules', 'scripts'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
function writeChanged(file, data) {
  if (fs.existsSync(file) && fs.readFileSync(file).equals(Buffer.from(data))) return false;
  fs.writeFileSync(file, data);
  return true;
}
function sizesFor(file, html, offset) {
  if (file === 'index.html') return '(max-width: 968px) calc(100vw - 44px), (max-width: 1280px) calc((100vw - 105px) / 2), 588px';
  if (file === 'works.html') return '(max-width: 650px) calc(100vw - 32px), (max-width: 800px) calc((100vw - 50px) / 2), (max-width: 1000px) calc((100vw - 66px) / 2), (max-width: 1228px) calc((100vw - 84px) / 3), 382px';
  if (file.startsWith('works/')) return '(max-width: 800px) calc(100vw - 32px), (max-width: 1228px) calc(100vw - 48px), 1180px';
  const wideContainer = html.includes('href="/service-page-layout.css"');
  const heroStart = html.indexOf('<div class="hero-visual">');
  const heroEnd = heroStart < 0 ? -1 : html.indexOf('</div>', heroStart);
  if (heroStart >= 0 && offset > heroStart && offset < heroEnd) {
    return '(max-width: 800px) calc(100vw - 32px), (max-width: 1228px) calc(55vw - 58.3px), 618px';
  }
  return wideContainer
    ? '(max-width: 420px) calc(100vw - 24px), (max-width: 800px) calc(100vw - 32px), (max-width: 1304px) calc((100vw - 84px) / 2), 610px'
    : '(max-width: 800px) calc(100vw - 32px), (max-width: 1228px) calc((100vw - 68px) / 2), 580px';
}

async function main() {
  const pages = htmlFiles(root);
  const sources = new Set();
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    for (const img of html.matchAll(/<img\b[^>]*>/gi)) {
      const src = img[0].match(/\bsrc="(\/works-images\/[^"?]+\.webp)(?:\?[^"]*)?"/);
      if (src) sources.add(src[1]);
    }
  }
  const variants = new Map();
  let writtenAssets = 0;
  for (const source of [...sources].sort()) {
    const original = path.join(root, source.slice(1));
    const metadata = await sharp(original).metadata();
    const originalBytes = fs.statSync(original).size;
    const entries = [];
    for (const width of widths.filter(width => width < metadata.width)) {
      const url = source.replace(/\.webp$/, '-' + width + 'w.webp');
      const buffer = await sharp(original)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: source.includes('/home-') ? 78 : 82, effort: 5 })
        .toBuffer();
      // Do not offer a smaller-resolution file that costs more to download.
      if (buffer.length >= originalBytes) continue;
      if (writeChanged(path.join(root, url.slice(1)), buffer)) writtenAssets++;
      entries.push({ url, width, bytes: buffer.length });
    }
    entries.push({ url: source, width: metadata.width, bytes: originalBytes });
    variants.set(source, entries);
  }
  let updatedPages = 0;
  let imageCount = 0;
  for (const absolute of pages) {
    const file = path.relative(root, absolute).replace(/\\/g, '/');
    const html = fs.readFileSync(absolute, 'utf8');
    let next = html.replace(/<img\b[^>]*>/gi, (img, offset) => {
      const src = img.match(/\bsrc="(\/works-images\/[^"?]+\.webp)(?:\?[^"]*)?"/);
      if (!src || !variants.has(src[1])) return img;
      imageCount++;
      const srcset = variants.get(src[1]).map(entry => entry.url + ' ' + entry.width + 'w').join(', ');
      const attrs = ' srcset="' + srcset + '" sizes="' + sizesFor(file, html, offset) + '"';
      let result = img.replace(/\s+(?:srcset|sizes)="[^"]*"/g, '').replace(/\s*\/?>$/, attrs + '>');
      const heroStart = html.indexOf('<div class="hero-visual">');
      const heroEnd = heroStart < 0 ? -1 : html.indexOf('</div>', heroStart);
      if (heroStart >= 0 && offset > heroStart && offset < heroEnd) {
        result = result.replace(/\s+loading="lazy"/, '');
        if (!/\bfetchpriority=/.test(result)) result = result.replace(/>$/, ' fetchpriority="high">');
      }
      return result;
    });
    if (file === 'index.html') {
      next = next.replace(/(<link\b[^>]*architectural-visualization-hero-mobile\.webp[^>]*media=")\(max-width: 800px\)/, '$1(max-width: 968px)');
      next = next.replace(/(<link\b[^>]*architectural-visualization-hero\.webp[^>]*media=")\(min-width: 801px\)/, '$1(min-width: 969px)');
    }
    const background = {
      'works.html': '/works-images/dental-clinic-waiting-room-cg.webp',
      'interior-rendering.html': '/works-images/tower-mansion-3.webp',
      'exterior-rendering.html': '/works-images/restaurant-exterior.webp'
    }[file];
    if (background) {
      const entries = variants.get(background);
      const one = entries.find(entry => entry.width === 800) || entries[0];
      const two = entries.find(entry => entry.width === 1600) || entries[entries.length - 1];
      const rule = '<style id="responsive-hero-image">@media(max-width:800px){.hero{background-image:linear-gradient(90deg,rgba(10,10,10,.94),rgba(10,10,10,.32)),url("' + one.url + '");background-image:linear-gradient(90deg,rgba(10,10,10,.94),rgba(10,10,10,.32)),image-set(url("' + one.url + '") 1x,url("' + two.url + '") 2x)}}</style>';
      next = next.replace(/<style id="responsive-hero-image">[\s\S]*?<\/style>\r?\n?/g, '');
      const newline = html.includes('\r\n') ? '\r\n' : '\n';
      next = next.replace('</head>', rule + newline + '</head>');
    }
    if (writeChanged(absolute, next)) updatedPages++;
  }
  console.log(JSON.stringify({
    sources: sources.size, writtenAssets, updatedPages, responsiveImages: imageCount,
    examples: [...variants].filter(([source]) => /hotel-lobby|ginza-sushi-restaurant-interior/.test(source))
      .map(([source, entries]) => ({ source, originalBytes: entries[entries.length - 1].bytes, mobile800Bytes: entries.find(entry => entry.width === 800)?.bytes }))
  }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
