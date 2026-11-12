import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

for (const page of ['index.html', 'drops/index.html', 'exchange/index.html', 'collection-utility/index.html']) {
  const html = await readFile(new URL(`../../${page}`, import.meta.url), 'utf8');
  const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(([, attrs, body]) => ({
    href: /\bhref="([^"]*)"/.exec(attrs)?.[1],
    classes: /\bclass="([^"]*)"/.exec(attrs)?.[1] || '',
    label: body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
  }));
  const utility = anchors.filter(anchor => anchor.label === 'COLLECTION UTILITY');
  assert.equal(utility.find(anchor => anchor.classes.includes('nav-link'))?.href, '/collection-utility',
    `${page}: working header navigation control`);
  assert.equal(utility.find(anchor => anchor.classes.includes('footer-link'))?.href, '#',
    `${page}: footer points to the same page fragment instead of Utility`);
}
console.log('All four shells: Utility header links to the route; Utility footer remains a same-page # link.');
