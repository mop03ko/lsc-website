import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
test('source forms preserve accessible names and safe POST', async () => {
  const $ = load(await fs.readFile('index.html', 'utf8'));
  assert.equal($('h1').length, 1);
  assert.equal($('main').length, 1);
  for (const el of $(
    '#contactForm input:not([name=website]),#contactForm textarea,#contactForm select',
  ).toArray())
    assert.equal($(`label[for="${$(el).attr('id')}"]`).length, 1);
  assert.equal($('#contactForm').attr('method'), 'post');
  assert.equal($('#calcSlider').attr('step'), '1');
  assert.equal($('.messenger-fab').length, 0);
  assert.equal($('select option').filter((_, e) => !$(e).is('[value]')).length, 0);
});
test('public pages have valid internal links, metadata and optimized assets', async () => {
  const sitemap = await fs.readFile('dist/sitemap.xml', 'utf8');
  const urls = [...sitemap.matchAll(/<loc>https:\/\/lsc.mn([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.equal(urls.length, 10);
  for (const url of urls) {
    const $ = load(await fs.readFile(path.join('dist', url, 'index.html'), 'utf8'));
    assert.equal($('link[rel=canonical]').attr('href'), 'https://lsc.mn' + url);
    assert.equal($('h1').length, 1);
    assert.equal($('html').attr('lang'), url.startsWith('/en/') ? 'en' : 'mn');
    for (const e of $('a[href^="/"],img,script[src],link[rel=stylesheet]').toArray()) {
      const target = $(e).attr('href') || $(e).attr('src');
      if (!target.startsWith('/')) continue;
      const [pathname, anchor] = target.split('#');
      const file = path.join('dist', pathname.endsWith('/') ? pathname + 'index.html' : pathname);
      await fs.access(file);
      if (anchor && file.endsWith('.html'))
        assert.ok(
          load(await fs.readFile(file, 'utf8'))(`#${anchor}`).length,
          `${url}: missing ${target}`,
        );
    }
    for (const img of $('img').toArray()) {
      assert.ok($(img).attr('width'));
      assert.ok($(img).attr('height'));
      assert.ok($(img).attr('loading'));
    }
  }
});
