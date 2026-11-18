import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = ['index.html', 'drops/index.html', 'exchange/index.html', 'collection-utility/index.html'];
const routes = {
  HOME: '/',
  'COLLECTION UTILITY': '/collection-utility',
  DROPS: '/drops',
  'THE EXCHANGE': '/exchange',
};
const externalLinks = [
  ['OBJKT', 'https://objkt.com/@chokedesigns'],
  ['OPENSEA', 'https://opensea.io/0x1153a79bf1d42fd71cfc8b94cec299bf7b0dea29'],
  ['RARIBLE', 'https://rarible.com/chokedesigns/owned'],
  ['FOUNDATION', 'https://foundation.app/@chokedesigns'],
  ['MALLOW', 'https://mallow.art/u/choke'],
  ['EXCHANGE.ART', 'https://exchange.art/choke/nfts'],
  ['TWITTER / X', 'https://x.com/chokedesigns'],
  ['INSTAGRAM', 'https://www.instagram.com/chokedesigns/'],
  ['DISCORD', 'https://discord.gg/TQZnfncTYz'],
];

for (const page of pages) {
  const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
  const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(([, attrs, body]) => ({
    href: /\bhref="([^"]*)"/.exec(attrs)?.[1],
    classes: (/\bclass="([^"]*)"/.exec(attrs)?.[1] || '').split(/\s+/),
    target: /\btarget="([^"]*)"/.exec(attrs)?.[1],
    label: body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
  }));
  const withClass = name => anchors.filter(anchor => anchor.classes.includes(name));

  test(`${page}: Utility footer resolves to the public route from root and nested shells`, () => {
    const utility = withClass('footer-link').filter(anchor => anchor.label === 'COLLECTION UTILITY');
    assert.equal(utility.length, 1);
    assert.equal(utility[0].href, '/collection-utility');
    for (const origin of ['https://example.org', 'http://localhost:4000']) {
      for (const path of [page, page.replace(/index\.html$/, ''), 'pages-sanity/collection-utility?check=1#nav']) {
        assert.equal(new URL(utility[0].href, `${origin}/${path}`).href, `${origin}/collection-utility`);
      }
    }
  });

  test(`${page}: header, other footer links, and wallet action anchors retain their destinations`, () => {
    assert.deepEqual(withClass('nav-link').map(({ label, href }) => [label, href]), [
      ['COLLECTION UTILITY', routes['COLLECTION UTILITY']], ['DROPS', routes.DROPS], ['THE EXCHANGE', routes['THE EXCHANGE']],
    ]);
    assert.deepEqual(withClass('navbar-brand').map(anchor => anchor.href), ['/']);
    const footer = withClass('footer-link');
    assert.deepEqual(footer.filter(anchor => anchor.label in routes && anchor.label !== 'COLLECTION UTILITY')
      .map(({ label, href }) => [label, href]), [['HOME', '/'], ['DROPS', '/drops'], ['THE EXCHANGE', '/exchange']]);
    assert.deepEqual(footer.filter(anchor => !(anchor.label in routes))
      .map(({ label, href, target }) => [label, href, target]), externalLinks.map(link => [...link, '_blank']));
    for (const name of ['mobile-status-connect-button', 'wallet-connect', 'connected-state', 'disconnect-hover']) {
      assert.deepEqual(withClass(name).map(anchor => anchor.href), ['#'], name);
    }
  });
}
