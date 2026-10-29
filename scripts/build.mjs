import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import sharp from 'sharp';
import { build, transform } from 'esbuild';
const out = path.resolve('dist');
if (path.dirname(out) !== process.cwd() || path.basename(out) !== 'dist')
  throw new Error('Unexpected build output');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.mkdir(path.join(out, 'assets'), { recursive: true });
const hash = (b) => createHash('sha256').update(b).digest('hex').slice(0, 12);
async function asset(name, buffer, ext) {
  const url = `/assets/${name}.${hash(buffer)}.${ext}`;
  await fs.writeFile(path.join(out, url), buffer);
  return url;
}
const js = await build({
  entryPoints: ['main.js'],
  bundle: true,
  minify: true,
  write: false,
  format: 'esm',
  target: ['es2022'],
  legalComments: 'none',
});
const jsUrl = await asset('app', js.outputFiles[0].contents, 'js');
const css = await transform(await fs.readFile('style.css', 'utf8'), {
  loader: 'css',
  minify: true,
});
const cssUrl = await asset('site', css.code, 'css');
const template = await fs.readFile('index.html', 'utf8');
const dict = JSON.parse(await fs.readFile('content/translations.json', 'utf8'));
const norm = (s) =>
  s
    .replace(/<br\s*\/>/gi, '<br>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const images = new Map();
async function image(src) {
  if (images.has(src)) return images.get(src);
  const data = await fs.readFile(src),
    name = path.basename(src, path.extname(src));
  if (src.endsWith('.svg')) {
    const result = { src: await asset(name, data, 'svg'), width: 300, height: 72 };
    images.set(src, result);
    return result;
  }
  const info = await sharp(data).metadata(),
    variants = [];
  for (const width of [...new Set([480, 960, 1440].map((w) => Math.min(w, info.width)))]) {
    const buffer = await sharp(data)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    variants.push({ width, src: await asset(name + '-' + width, buffer, 'webp') });
  }
  const result = {
    src: variants[Math.min(1, variants.length - 1)].src,
    srcset: variants.map((v) => `${v.src} ${v.width}w`).join(', '),
    width: info.width,
    height: info.height,
  };
  images.set(src, result);
  return result;
}
const logo = await image('images/logo.svg');
const social = await sharp('images/hero-bg-new.jpg')
  .rotate()
  .resize(1200, 630, { fit: 'cover' })
  .jpeg({ quality: 80 })
  .toBuffer();
await fs.writeFile(path.join(out, 'social.jpg'), social);
// Existing brand mark, cropped for a small square favicon.
const favicon = await sharp('images/logo.svg')
  .extract({ left: 0, top: 0, width: 237, height: 237 })
  .resize(48, 48)
  .png()
  .toBuffer();
await fs.writeFile(path.join(out, 'favicon.png'), favicon);
const organization = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Light Steel Construction',
  url: 'https://lsc.mn/',
  logo: 'https://lsc.mn' + logo.src,
  telephone: '+97699080126',
  email: 'info@lsc.mn',
  sameAs: ['https://www.facebook.com/lightsteelco'],
});
const schemaHash = createHash('sha256').update(organization).digest('base64');
const pages = [];
function translate($, lang) {
  if (lang === 'en') {
    $('body *').each((_, el) => {
      if ($(el).parents('[data-translated]').length) return;
      const en = $(el).attr('data-en'),
        key = norm($(el).html() || '');
      if (en !== undefined) {
        $(el).text(en).attr('data-translated', '');
      } else if (Object.hasOwn(dict, key)) $(el).html(dict[key]).attr('data-translated', '');
    });
    $('[data-en-label]').each((_, el) => $(el).attr('aria-label', $(el).attr('data-en-label')));
    $('[name=name]').attr('placeholder', 'Your name');
    $('[name=message]').attr(
      'placeholder',
      'Location, building size, intended use and requirements…',
    );
    $('.lang-toggle')
      .attr({ href: '/', lang: 'mn', hreflang: 'mn', 'aria-label': 'Монгол' })
      .text('МН');
    $('a[href^="/products/"],a[href^="/privacy/"]').each((_, el) =>
      $(el).attr('href', '/en' + $(el).attr('href')),
    );
  }
  $('[data-en],[data-en-label],[data-translated]').removeAttr(
    'data-en data-en-label data-translated',
  );
}
async function page(url, lang, body = null, title = null, description = null) {
  const $ = load(template);
  if (body) {
    $('main').html(body);
    $('main').addClass('detail-page');
    $('.messenger-link').remove();
  }
  translate($, lang);
  $('html').attr('lang', lang);
  $('head link[rel=stylesheet]').attr('href', cssUrl);
  $('script[type=module]').attr('src', jsUrl);
  if (body) {
    $('nav a[href^="#"],footer a[href^="#"],#mobileMenu a[href^="#"]').each((_, el) =>
      $(el).attr('href', (lang === 'en' ? '/en/' : '/') + $(el).attr('href')),
    );
  }
  const mnUrl = url.replace(/^\/en\//, '/'),
    enUrl = '/en' + mnUrl;
  $('.lang-toggle').attr('href', lang === 'en' ? mnUrl : enUrl);
  const heading =
    title ||
    (lang === 'en'
      ? 'Light Steel Construction | Steel Frame Solutions'
      : 'Light Steel Construction | Хөнгөн ган карказ');
  const desc =
    description ||
    (lang === 'en'
      ? 'Light steel frame manufacturing and assembly. Compare profiles, estimate project costs and request a quotation.'
      : 'Хөнгөн ган карказын үйлдвэрлэл, угсралт. Профиль сонгож, төслийн баримжаа үнэ тооцоолон үнийн санал аваарай.');
  $('title').text(heading);
  $('meta[name=description]').attr('content', desc);
  $('head').append(
    `<link rel="canonical" href="https://lsc.mn${url}"><link rel="alternate" hreflang="mn" href="https://lsc.mn${mnUrl}"><link rel="alternate" hreflang="en" href="https://lsc.mn${enUrl}"><link rel="alternate" hreflang="x-default" href="https://lsc.mn${mnUrl}"><link rel="icon" type="image/png" href="/favicon.png"><meta property="og:type" content="website"><meta property="og:url" content="https://lsc.mn${url}"><meta property="og:image" content="https://lsc.mn/social.jpg"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${organization}</script>`,
  );
  $('<meta property="og:title">').attr('content', heading).appendTo('head');
  $('<meta property="og:description">').attr('content', desc).appendTo('head');
  for (const el of $('img').toArray()) {
    const src = $(el).attr('src');
    if (!src?.startsWith('images/')) continue;
    const data = await image(src);
    $(el).attr({ src: data.src, width: data.width, height: data.height, decoding: 'async' });
    if (data.srcset)
      $(el).attr({
        srcset: data.srcset,
        sizes: $(el).hasClass('hero-img')
          ? '100vw'
          : '(max-width: 600px) 100vw, (max-width: 900px) 50vw, 550px',
      });
    const critical = $(el).hasClass('hero-img') || $(el).parents('nav').length;
    $(el).attr('loading', critical ? 'eager' : 'lazy');
    if ($(el).hasClass('hero-img')) $(el).attr('fetchpriority', 'high');
    if (lang === 'en' && $(el).attr('alt'))
      $(el).attr('alt', dict[$(el).attr('alt')] || 'Light Steel Construction');
  }
  if (lang === 'en') $('#calcSlider').attr('aria-label', 'Building area');
  const dir = path.join(out, url);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), $.html());
  pages.push(url);
}
await page('/', 'mn');
await page('/en/', 'en');
const productData = [
  [
    '89',
    '89мм стандарт профиль',
    '89mm standard profile',
    'Хөнгөн хийцийн хана, таазны шийдэлд зориулсан профиль.',
    'Profile for light-frame wall and ceiling solutions.',
    'product-1.jpg',
  ],
  [
    '140',
    '140мм хүчитгэсэн профиль',
    '140mm reinforced profile',
    'Ачаалал болон зориулалтад тохируулан инженерийн тооцоогоор сонгох профиль.',
    'A profile selected through engineering calculations for the intended use and loading.',
    'product-2.jpg',
  ],
  [
    'floor',
    'Давхар дундын хучилт',
    'Floor framing',
    'Давхар хоорондын хучилт, дээврийн бүтцийн захиалгат шийдэл.',
    'Project-specific solutions for intermediate floors and roof structures.',
    'product-3.jpg',
  ],
];
for (const [id, mn, en, descMn, descEn, img] of productData)
  for (const lang of ['mn', 'en']) {
    const enMode = lang === 'en',
      label = enMode ? en : mn,
      base = enMode ? '/en/' : '/';
    const body = `<section><div class="container"><a class="text-link" href="${base}#products">${enMode ? '← All profiles' : '← Бүх профиль'}</a><div class="detail-grid"><div><div class="section-tag">${enMode ? 'Product information' : 'Бүтээгдэхүүний мэдээлэл'}</div><h1>${label}</h1><p class="lead">${enMode ? descEn : descMn}</p><dl class="specs"><dt>${enMode ? 'Selection' : 'Сонголт'}</dt><dd>${enMode ? 'Based on approved engineering drawings' : 'Батлагдсан инженерийн зурагт үндэслэнэ'}</dd><dt>${enMode ? 'Thickness, steel grade, coating' : 'Зузаан, гангийн марк, бүрхүүл'}</dt><dd>${enMode ? 'Confirmed in the project quotation and material certificate' : 'Төслийн үнийн санал, материалын гэрчилгээгээр баталгаажуулна'}</dd><dt>${enMode ? 'Loads, spans, fire and acoustic performance' : 'Даац, алгасал, гал ба дуу тусгаарлалт'}</dt><dd>${enMode ? 'Defined for the complete engineered assembly' : 'Иж бүрэн хийцийн инженерийн тооцоогоор тогтооно'}</dd></dl><p>${enMode ? 'Send the intended use, area, location and available drawings. Request the relevant technical documents before confirming your order.' : 'Зориулалт, талбай, байршил болон боломжтой зургаа илгээнэ үү. Захиалга батлахаас өмнө холбогдох техникийн баримтыг лавлаарай.'}</p><a class="btn-primary" href="${base}#contact">${enMode ? 'Request specifications & quote' : 'Үзүүлэлт, үнийн санал авах'}</a></div><img src="images/${img}" alt="${label}"></div></div></section>`;
    await page(`${base}products/${id}/`, lang, body, `${label} | LSC`);
  }
for (const lang of ['mn', 'en']) {
  const en = lang === 'en',
    base = en ? '/en/' : '/';
  const body = `<section><article class="container prose"><h1>${en ? 'Privacy information' : 'Мэдээлэл хамгаалах тухай'}</h1><p>${en ? 'We use your name, phone number and project details to respond to your inquiry and prepare a quotation.' : 'Таны нэр, утасны дугаар, төслийн тайлбарыг хүсэлтэд хариу өгөх, үнийн санал бэлтгэхэд ашиглана.'}</p><h2>${en ? 'Your request' : 'Таны хүсэлт'}</h2><p>${en ? 'Requests are stored securely by Light Steel Construction. Authorized staff may use email and a restricted spreadsheet to process them. Do not include payment card details, identity documents or other sensitive information.' : 'Хүсэлтийг Light Steel Construction хамгаалалттай хадгална. Эрх бүхий ажилтан хүсэлтийг боловсруулахдаа имэйл, хязгаарлагдсан хандалттай хүснэгт ашиглаж болно. Картын мэдээлэл, иргэний баримт бичиг болон бусад эмзэг мэдээлэл бүү оруулаарай.'}</p><h2>${en ? 'Site measurements' : 'Сайтын хэмжилт'}</h2><p>${en ? 'We count calculator use, quote clicks and contact clicks without sending your name, phone number or message to analytics. Do Not Track and Global Privacy Control signals are respected. No analytics cookies are set.' : 'Тооцоолуур ашиглалт, үнийн санал болон холбоо барих товшилтыг нэр, утас, тайлбаргүйгээр тоолно. Do Not Track болон Global Privacy Control тохиргоог хүндэтгэнэ. Analytics cookie ашиглахгүй.'}</p><h2>${en ? 'Access and deletion' : 'Мэдээлэл авах, устгуулах'}</h2><p>${en ? 'To ask about, correct or delete your inquiry, contact ' : 'Хүсэлтийнхээ мэдээллийг лавлах, засуулах, устгуулах бол '}<a href="mailto:info@lsc.mn">info@lsc.mn</a>${en ? ' or call ' : ' эсвэл '}<a href="tel:+97699080126">+976 9908 0126</a>. ${en ? 'Include your request reference if available.' : 'Боломжтой бол хүсэлтийн дугаараа дурдана уу.'}</p><p>${en ? 'External messaging and map services apply their own privacy terms.' : 'Гаднын мессеж болон газрын зургийн үйлчилгээ өөрийн мэдээллийн бодлоготой.'}</p><a class="text-link" href="${base}">${en ? 'Back to home' : 'Нүүр хуудас'}</a></article></section>`;
  await page(base + 'privacy/', lang, body, en ? 'Privacy | LSC' : 'Мэдээлэл хамгаалах | LSC');
}
await fs.writeFile(
  path.join(out, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    pages.map((url) => `<url><loc>https://lsc.mn${url}</loc></url>`).join('') +
    '</urlset>',
);
await fs.writeFile(
  path.join(out, 'robots.txt'),
  'User-agent: *\nAllow: /\nDisallow: /send.php\nDisallow: /events.php\nDisallow: /server/\nSitemap: https://lsc.mn/sitemap.xml\n',
);
await fs.writeFile(
  path.join(out, '404.html'),
  '<!doctype html><html lang="mn"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>404 | LSC</title><h1>Хуудас олдсонгүй · Page not found</h1><a href="/">Нүүр · Home</a></html>',
);
await fs.writeFile(
  path.join(out, '.htaccess'),
  (await fs.readFile('deploy/apache.htaccess', 'utf8')).replaceAll('__SCHEMA_HASH__', schemaHash),
);
for (const name of ['send.php', 'events.php']) await fs.copyFile(name, path.join(out, name));
for (const dir of ['server', 'config', 'vendor'])
  await fs.cp(dir, path.join(out, dir), {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git`),
  });
await fs.writeFile(
  path.join(out, 'version.json'),
  JSON.stringify({ version: process.env.GITHUB_SHA || 'local', builtAt: new Date().toISOString() }),
);
console.log(`Built ${pages.length} pages and ${images.size} optimized images in dist/`);
