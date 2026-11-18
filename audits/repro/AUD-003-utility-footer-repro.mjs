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
  const footer = utility.filter(anchor => anchor.classes.split(/\s+/).includes('footer-link'));
  assert.equal(footer.length, 1, `${page}: one Utility footer link`);
  assert.equal(footer[0].href, '/collection-utility',
    `${page}: footer uses the same public route as the header`);
  assert.equal(new URL(footer[0].href, `https://example.org/${page}`).href,
    'https://example.org/collection-utility', `${page}: footer escapes the current shell path`);
}
console.log('All four shells: Utility header and footer navigate to /collection-utility.');
