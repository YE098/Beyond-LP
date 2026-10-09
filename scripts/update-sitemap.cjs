#!/usr/bin/env node
// Run after significant page/content/image changes; retain unchanged page dates.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const dateArg = process.argv.find(arg => arg.startsWith('--date='));
const today = dateArg ? dateArg.slice(7) : new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error('Use --date=YYYY-MM-DD');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const changed = new Set([
  ...git(['diff', '--name-only', 'HEAD']).split('\n'),
  ...git(['ls-files', '--others', '--exclude-standard']).split('\n')
].filter(Boolean));
function lastmod(url) {
  const pathname = new URL(url).pathname;
  const page = pathname === '/' ? 'index.html' : pathname.replace(/^\/|\/$/g, '') + '.html';
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const related = [page];
  for (const m of html.matchAll(/\b(?:src|href)="\/([^"#?]+)(?:\?[^"]*)?"/g)) {
    if (/\.(?:css|js|webp|png|svg)$/.test(m[1]) && fs.existsSync(path.join(root, m[1]))) related.push(m[1]);
  }
  if (related.some(file => changed.has(file))) return today;
  const committed = git(['log', '-1', '--format=%aI', '--', ...related]);
  if (!committed) throw new Error('No content date for ' + page);
  return committed.slice(0, 10);
}
let count = 0;
for (const file of ['sitemap.xml', 'image-sitemap.xml']) {
  const absolute = path.join(root, file);
  const original = fs.readFileSync(absolute, 'utf8');
  const next = original.replace(/<url>([\s\S]*?)<\/url>/g, (block, body) => {
    const url = body.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!url) return block;
    const value = lastmod(url);
    if (/<lastmod>/.test(body)) {
      const replacement = block.replace(/<lastmod>[^<]*<\/lastmod>/, '<lastmod>' + value + '</lastmod>');
      if (replacement !== block) count++;
      return replacement;
    }
    count++;
    return block.replace('</loc>', '</loc>\n    <lastmod>' + value + '</lastmod>');
  });
  if (next !== original) fs.writeFileSync(absolute, next);
}
console.log(JSON.stringify({ updatedEntries: count, dateForChangedPages: today }));
