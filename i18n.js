// ═══════════════════════════════════════
//   LIGHT STEEL CONSTRUCTION — i18n.js
//   МН ↔ EN хэл солигч
// ═══════════════════════════════════════
//
// Ажиллах зарчим: DICT дотор монгол текст (түлхүүр) → англи орчуулга.
// Хуудас ачаалахад тохирох элементүүдийг олж тэмдэглээд,
// солиход innerHTML-ийг нь орчуулгаар солино. Монгол руу буцаахад
// анхны HTML-ийг сэргээнэ. Шинэ текст нэмбэл энд орчуулгыг нь нэмнэ.

(function () {
  'use strict';

  const MN_TITLE = 'Light Steel Construction | Хөнгөн ган Карказ';
  const EN_TITLE = 'Light Steel Construction | Light Steel Frame';

  const DICT = {
    // ── Цэс / Nav ──
    'Бидний тухай': 'About us',
    'Бүтээгдэхүүн': 'Products',
    'Давуу тал': 'Advantages',
    'Үнэ тооцоолох': 'Price calculator',
    'Хэрэглээ': 'Applications',
    'Холбоо барих': 'Contact',

    // ── Hero ──
    'ХӨНГӨН ГАН КАРКАЗ': 'LIGHT STEEL FRAME',
    'БАРИЛГЫН СИСТЕМ': 'CONSTRUCTION SYSTEM',
    'Хөнгөн хийц, Дэвшилтэт технологи': 'Lightweight structures, advanced technology',
    'Хурдан угсралт': 'Fast assembly',
    'Балл газар хөдлөлт': 'Magnitude quake resistant',
    'Өдрийн хүчин чадал': 'Daily capacity',
    '20т': '20t',
    'Үнэ тооцоолуулах': 'Get a price estimate',
    'Бүтээгдэхүүн үзэх': 'View products',

    // ── Бидний тухай / About ──
    '14 жилийн <br><em>туршлага</em>': '14 years of <br><em>experience</em>',
    '2011 онд <strong>Металл Хаус ХХК</strong> нэртэйгээр уул уурхайн кемп, аялал жуулчлалын байр бэлтгэн нийлүүлж эхэлсэн. Энэ хугацаанд уул уурхай, аялал зуучлал, барилгын өргөтгөл, хаус хотхон зэрэг <strong>100 гаруй ажилд</strong> гар бие оролцсон.':
      'Founded in 2011 as <strong>Metal House LLC</strong>, we began by supplying mining camps and tourist accommodations. Since then we have taken part in <strong>over 100 projects</strong> across mining, tourism, building extensions, and housing communities.',
    '2015 оноос хөнгөн ган карказын үйлдвэрлэл, угсралтыг нэвтрүүлж, 2025 онд <strong>Light Steel Construction ХХК</strong> болон өргөжиж үйлдвэрлэлийн цогц логистик төв болон хөгжлөө.':
      'In 2015 we introduced light steel frame manufacturing and assembly, and in 2025 expanded into <strong>Light Steel Construction LLC</strong> — a fully integrated production and logistics center.',
    'Үүссэн он': 'Founded',
    'Гүйцэтгэсэн төсөл': 'Completed projects',
    'Мэргэжлийн баг': 'Professional team',
    'Өдрийн үйлдвэрлэл': 'Daily production',
    'Металл Хаус ХХК': 'Metal House LLC',
    'Уул уурхайн кемп, аялал жуулчлалын байр нийлүүлэх үйл ажиллагаа эхэлсэн':
      'Began supplying mining camps and tourist accommodations',
    'Ган карказ эхэлсэн': 'Steel frame production began',
    'Хөнгөн ган карказын үйлдвэрлэл, угсралтыг нэвтрүүлж уурхай, хаус хотхон руу тэлсэн':
      'Introduced light steel frame manufacturing and assembly, expanding into mining and housing projects',
    'Light Steel ХХК': 'Light Steel LLC',
    '89мм, 140мм, давхар дундын хучилт — цогц логистик төв болсон':
      '89mm, 140mm, mid-floor systems — became a complete logistics center',

    // ── Бүтээгдэхүүн / Products ──
    'Профилийн <em>төрлүүд</em>': 'Profile <em>types</em>',
    'Барилгын зориулалтаас хамааран 3 төрлийн профиль үйлдвэрлэнэ':
      'We manufacture 3 profile types depending on the building purpose',
    'Стандарт': 'Standard',
    'Хүчитгэсэн': 'Reinforced',
    'Тусгай': 'Special',
    '89<span>мм</span>': '89<span>mm</span>',
    '140<span>мм</span>': '140<span>mm</span>',
    'Давхар': 'Floor',
    'Стандарт профиль': 'Standard profile',
    'Хөнгөн хийцийн хана, таазны бүтцэд хэрэглэгддэг. Гэр, жижиг барилгад тохиромжтой.':
      'Used for lightweight walls and ceiling structures. Ideal for homes and small buildings.',
    'Дулаан тусгаарлалт сайн': 'Great thermal insulation',
    'Зардал хэмнэлттэй': 'Cost effective',
    'Хүчитгэсэн профиль': 'Reinforced profile',
    'Олон давхар, өндөр даацтай барилгад зориулагдсан. Давхар дундын хучилтад хэрэглэнэ.':
      'Designed for multi-story, high-load buildings. Used in mid-floor structures.',
    'Өндөр даац': 'High load capacity',
    'Олон давхар боломж': 'Multi-story capability',
    'Дуу чимээ тусгаарлалт': 'Sound insulation',
    'Дундын хучилт': 'Mid-floor deck',
    'Давхар хоорондын хучилт болон дээврийн зарим бүтцэд хүчитгэл хийх боломжтой.':
      'For floor decks between stories and reinforcing certain roof structures.',
    'Давхар дундын даац': 'Inter-floor load capacity',
    'Дээврийн бүтэц': 'Roof structures',
    'Захиалгат шийдэл': 'Custom solutions',
    'Үйлдвэрлэлийн хүчин чадал': 'Production capacity',
    '3 төрлийн профилийг хоногт 10 тонн ачаалалтай үед өдөрт 20 тонн бэлдэц үйлдвэрлэх боломжтой':
      'Capable of producing up to 20 tons of blanks per day across 3 profile types',
    '20т<span>/өдөр</span>': '20t<span>/day</span>',

    // ── Давуу тал / Advantages ──
    'Яагаад ган <em>карказ</em>?': 'Why steel <em>frame</em>?',
    '3x Хурдан угсралт': '3x faster assembly',
    'Уламжлалт технологиос 3 дахин хурдан. Өвлийн улиралд ч угсралт хийх боломжтой — чанарт нөлөөлөхгүй.':
      '3 times faster than traditional methods. Assembly is possible even in winter — with no loss of quality.',
    '+9 Магнитудад тэсвэртэй': 'Withstands magnitude 9+ quakes',
    '9 баллаас дээш газар хөдлөлтөнд бүрэн тэсвэртэй бүтэц. Монголын нөхцөлд хамгийн тохиромжтой.':
      'Fully resistant to earthquakes above magnitude 9. Ideal for Mongolian conditions.',
    'Гал шатахгүй': 'Fire resistant',
    'Ган бүтэц галд шатахгүй тул барилгын аюулгүй байдал өндөр. Мөөгөнцөр, хортон шавьж үүрлэхгүй.':
      'Steel structures do not burn, providing high building safety. No mold or pest infestation.',
    '±1мм нарийвчлал': '±1mm precision',
    '10 метр тутамд ±1мм алдааны нарийвчлал. Хуурай технологиор барилгын 90%-с дээш хувийг гүйцэтгэнэ.':
      '±1mm tolerance per 10 meters. Over 90% of construction is completed using dry technology.',
    'Зэврэхгүй, 100 жил': 'Rust-free, 100-year lifespan',
    'Гальванжуулалтын Z275 стандартын бүрхүүлтэй. Зэврэхгүй, гажихгүй, 100 жил давсан чанар.':
      'Z275 standard galvanized coating. No rust, no warping — quality that lasts over 100 years.',
    'Байгаль орчинд ээлтэй': 'Environmentally friendly',
    '100% дахин боловсруулах боломжтой. Элс, хайрга, цемент бараг ашиглахгүй — хог хаягдал бага.':
      '100% recyclable. Uses almost no sand, gravel, or cement — minimal construction waste.',

    // ── Тооцоолуур / Calculator ──
    'Карказны <em>тооцоолуур</em>': 'Frame cost <em>calculator</em>',
    'Барих гэж буй барилгынхаа талбайг (м²) оруулах буюу гүйлгүүрээр сонгоход төсөв шууд тооцоологдоно.':
      'Enter or slide the area (m²) of your planned building and the budget is calculated instantly.',
    'Профилийн төрөл': 'Profile type',
    '89мм': '89mm',
    '140мм': '140mm',
    'Барилгын талбай': 'Building area',
    'м²': 'm²',
    '10 м²': '10 m²',
    '400 м²': '400 m²',
    '1 м² ≈': '1 m² ≈',
    'Карказны төмрийн үнэ': 'Frame steel price',
    'Шуруп, бэхэлгээ': 'Screws & fasteners',
    'Зураг төсөл': 'Design & drawings',
    'Угсралтын ажлын хөлс': 'Assembly labor',
    'Нийт үнэ': 'Total price',
    '* Тооцоолол баримжаа бөгөөд эцсийн үнэ зураг төсөл, тээвэрлэлт зэргээс хамаарч өөрчлөгдөж болно.':
      '* This is an estimate; the final price may vary depending on design and transportation.',
    'Дэлгэрэнгүй үнийн санал авах': 'Request a detailed quote',

    // ── Төлбөрийн хэлбэр / Payment ──
    'Төлбөрийн хэлбэрээ сонгоно уу': 'Choose your payment method',
    'Бэлэн төлөх': 'Pay in cash',
    'Нийт үнийн 100%-ийг бэлнээр төлөх': 'Pay 100% of the total price upfront',
    'Зээл': 'Loan',
    'Сарын 2.5% хүүтэй, 60 хүртэлх сарын хугацаатай барьцаат зээл':
      'Collateral loan at 2.5% monthly interest, up to 60 months',
    'Бартер': 'Barter',
    '<span data-pct="down">60</span>% мөнгө + <span data-pct="loan">40</span>% бараа, үйлчилгээгээр солилцох':
      '<span data-pct="down">60</span>% cash + <span data-pct="loan">40</span>% goods or services',
    'Бэлнээр төлөх нийт дүн': 'Total amount payable in cash',
    'Нэг удаагийн төлбөрөөр — нэмэлт шимтгэл, хүүгүй.': 'One-time payment — no fees, no interest.',
    'Зээлдэгчийн төрөл': 'Borrower type',
    'Иргэн': 'Individual',
    'Зээлийн дээд хэмжээ ₮50 сая · олголтын шимтгэл 1%': 'Loan limit ₮50M · 1% origination fee',
    'Аж ахуйн нэгж': 'Business entity',
    'Зээлийн дээд хэмжээ ₮300 сая · шимтгэл 1% (дээд тал нь ₮1.5 сая)':
      'Loan limit ₮300M · 1% fee (capped at ₮1.5M)',
    '2.5% сарын хүү': '2.5% monthly interest',
    'Хугацаа сонгох': 'Choose term',
    '12 сар': '12 mo',
    '24 сар': '24 mo',
    '36 сар': '36 mo',
    '48 сар': '48 mo',
    '60 сар': '60 mo',
    'Барьцаа: үл хөдлөх хөрөнгө, өмчлөх/эзэмших эрхтэй газар, автомашин, тоног төхөөрөмж (үнэлгээний 60%-д тооцно).':
      'Collateral: real estate, titled land, vehicles, and equipment (valued at 60%).',
    'Сарын төлөлт': 'Monthly payment',
    'Урьдчилгаа (дээд хэмжээнээс давсан хэсэг)': 'Down payment (amount above the loan limit)',
    'Зээлийн дүн': 'Loan amount',
    'Зээл олголтын шимтгэл (1%)': 'Origination fee (1%)',
    'Нийт төлөх дүн': 'Total repayment',
    '* Тэнцүү төлөлтөөр (аннуитет) тооцов. Зээлийн түүх, орлогын баталгаа шаардлагатай бөгөөд эцсийн нөхцөл гэрээгээр тодорхойлогдоно.':
      '* Calculated as equal (annuity) payments. Credit history and proof of income are required; final terms are set by contract.',
    'Мөнгөөр төлөх · <span data-pct="down">60</span>%': 'Cash payment · <span data-pct="down">60</span>%',
    'Бэлнээр эсвэл зээлээр': 'In cash or by loan',
    'Бартераар · <span data-pct="loan">40</span>%': 'By barter · <span data-pct="loan">40</span>%',
    'Таны санал болгох бараа, үйлчилгээгээр': 'With goods or services you offer',
    'Солилцох бараа, үйлчилгээнийхээ мэдээллийг «Холбоо барих» хэсгээр илгээгээрэй — бид хянаад тантай эргэн холбогдоно.':
      'Send us details of the goods or services you would like to exchange via the Contact section — we will review and get back to you.',

    // ── Хэрэглээ / Applications ──
    'Хаана <em>ашиглах</em> вэ?': 'Where can it be <em>used</em>?',
    'АОС, Зуслан': 'Private houses & cottages',
    'Нийтийн орон сууц': 'Apartment buildings',
    'Жуулчны кемп': 'Tourist camps',
    'Уул уурхайн кемп': 'Mining camps',
    'Зөөврийн сууц': 'Mobile homes',
    'Өргөтгөл, дээвэр': 'Extensions & roofing',

    // ── Промо / Promo ──
    'Ирээдүйн бат бөх барилгыг<br><em>ган карказаар</em> босгоё!':
      'Let’s build the durable buildings of the future<br><em>with steel frame</em>!',
    'Бат бөх, удаан эдэлгээтэй — олон арван жил чанараа хадгална':
      'Strong and durable — retains its quality for decades',
    'Хурдан угсралт — цаг хугацаа, зардлаа хэмнэнэ': 'Fast assembly — saves time and money',
    'Дулаан, дуу тусгаарлагчтай — тав тухтай орчин бүрдэнэ':
      'Thermal and sound insulation — a comfortable environment',
    'Захиалгат шийдэл — загвар, хэмжээ, зориулалтаар үйлдвэрлэнэ':
      'Custom solutions — built to your design, size, and purpose',
    'Үнэ хямд, чанар өндөр — хэмнэлттэй хөрөнгө оруулалт':
      'Affordable price, high quality — a smart investment',
    'Өнөөдөр захиалах': 'Order today',

    // ── FAQ ──
    'Асуулт & Хариулт': 'Q & A',
    'Түгээмэл <em>асуултууд</em>': 'Frequently asked <em>questions</em>',
    'Зэврэх үү?': 'Does it rust?',
    'Үгүй. Гальванжуулалтын тусгай Z275 стандартын бүрхүүлтэй тул зэврэхгүй, урт хугацаанд хамгаалагдсан.':
      'No. It has a special Z275 galvanized coating, so it does not rust and stays protected long-term.',
    'Өвөл угсарч болох уу?': 'Can it be assembled in winter?',
    'Тийм. Хуурай технологиор угсардаг тул цаг агаараас хамаарахгүй. Өвөл ч чанартай угсарна.':
      'Yes. Dry assembly technology means weather is not a factor. Quality assembly even in winter.',
    'Дуу чимээ их үү?': 'Is it noisy?',
    'Үгүй. Тусгаарлах материал хэрэглэснээр дуу чимээ сайн тусгаарлагдана. 140мм профиль дуу тусгаарлалт илүү сайн.':
      'No. With insulation materials, sound is well isolated. The 140mm profile offers even better sound insulation.',
    'Засвар үйлчилгээ хэрэгтэй юу?': 'Does it need maintenance?',
    'Бараг үгүй. Хийцийн онцлогоос шалтгаалан урт хугацаанд засварын зардал маш бага байна.':
      'Almost none. Thanks to the structural design, long-term maintenance costs are very low.',
    'Хэдэн давхар барьж болох вэ?': 'How many stories can be built?',
    '140мм профилиар олон давхар байшин барих боломжтой. Инженерийн тооцоо хийж, давхрын тоог тодорхойлно.':
      'Multi-story buildings are possible with the 140mm profile. Engineering calculations determine the number of stories.',
    'Захиалгын хугацаа хэр болдог вэ?': 'How long do orders take?',
    'Өдөрт 20 тонн үйлдвэрлэх хүчин чадалтай тул ихэнх захиалгыг богино хугацаанд биелүүлэх боломжтой.':
      'With a capacity of 20 tons per day, most orders can be fulfilled in a short time.',

    // ── Холбоо барих / Contact ──
    'Зөвлөгөө <em>аваарай</em>': 'Get expert <em>advice</em>',
    'Манай мэргэжилтэн таны барилгын төсөлд үнэ тооцоолж, хамгийн тохиромжтой шийдлийг санал болгоно.':
      'Our specialists will estimate the cost of your project and recommend the best solution.',
    'Дуудлага, Viber, WhatsApp': 'Calls, Viber, WhatsApp',
    'И-мэйл': 'Email',
    'ЮНИОН БЮЛДИНГ А блок 15-р давхарт, 1501 тоот': 'UNION BUILDING, Block A, 15th floor, Suite 1501',
    'Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо<br>Нарны зам -62, ЮНЕСКО-гийн гудамж':
      'Ulaanbaatar, Sukhbaatar district, 1st khoroo<br>Narnii Zam 62, UNESCO street',
    'Биднийг дагаарай': 'Follow us',
    'Холбогдох': 'Contact us',
    'Нэр': 'Name',
    'Утасны дугаар': 'Phone number',
    '8 оронтой тоо оруулна уу': 'Enter an 8-digit number',
    'Барилгын төрөл': 'Building type',
    'Сонгоно уу...': 'Select...',
    'Барилгын өргөтгөл': 'Building extension',
    'Бусад': 'Other',
    'Нэмэлт мэдээлэл': 'Additional details',
    'Илгээх': 'Send',

    // ── Footer ──
    '© 2026 Light Steel Construction ХХК. Бүх эрх хуулиар хамгаалагдсан.':
      '© 2026 Light Steel Construction LLC. All rights reserved.'
  };

  // Placeholder аттрибутууд
  const PLACEHOLDERS = [
    ['input[name="name"]', 'Таны нэр', 'Your name'],
    ['textarea[name="message"]', 'Барилгын хэмжээ, давхар, онцлог...', 'Building size, stories, special requirements...']
  ];

  const norm = s => s
    .replace(/<br\s*\/>/gi, '<br>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  const items = [];

  function collect() {
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('script, style')) return;
      // Аль хэдийн тэмдэглэгдсэн элементийн доторхыг алгасна
      const parentUnit = el.parentElement && el.parentElement.closest('[data-i18n-unit]');
      if (parentUnit) return;
      const key = norm(el.innerHTML);
      if (Object.prototype.hasOwnProperty.call(DICT, key)) {
        el.setAttribute('data-i18n-unit', '');
        items.push({ el, mn: el.innerHTML, en: DICT[key] });
      }
    });
  }

  function setLang(lang) {
    window.LSC_LANG = lang;
    document.documentElement.lang = lang === 'en' ? 'en' : 'mn';
    document.title = lang === 'en' ? EN_TITLE : MN_TITLE;

    items.forEach(it => { it.el.innerHTML = lang === 'en' ? it.en : it.mn; });

    PLACEHOLDERS.forEach(([sel, mn, en]) => {
      const el = document.querySelector(sel);
      if (el) el.placeholder = lang === 'en' ? en : mn;
    });

    // Товч дээр ЭСРЭГ хэлийг харуулна
    document.querySelectorAll('.lang-toggle').forEach(b => {
      b.textContent = lang === 'en' ? 'МН' : 'EN';
    });

    try { localStorage.setItem('lsc-lang', lang); } catch (e) { /* private mode */ }

    // Динамик текстүүдээ (тооцоолуур г.м) шинэчлүүлэх дохио
    document.dispatchEvent(new CustomEvent('lsc:lang'));
  }

  collect();

  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(window.LSC_LANG === 'en' ? 'mn' : 'en');
    });
  });

  let saved = null;
  try { saved = localStorage.getItem('lsc-lang'); } catch (e) { /* private mode */ }
  if (saved === 'en') setLang('en');
  else window.LSC_LANG = 'mn';
})();
