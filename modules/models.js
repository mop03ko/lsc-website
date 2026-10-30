import { t } from '../i18n.js';

/* Area: gross floor area measured from the 3D model (m²). file: served from /models/. */
export const MODELS = {
  barnhouse: {
    name: ['Барнхаус', 'Barnhouse'],
    note: ['2 давхар · гараж', '2 storeys · garage'],
    file: '/models/barnhouse-1.glb',
    plan: '/models/barnhouse-1.plan.json',
    levels: {
      ground: ['1-р давхар', 'Ground floor'],
      upper: ['2-р давхар', 'Upper floor'],
    },
    dims: '11.4 × 14.4 м · 9.5 м',
    floors: [
      [['1-р давхар (гараж орсон)', 'Ground floor (incl. garage)'], 128.7],
      [['2-р давхар', 'Upper floor'], 91.7],
    ],
  },
  m1: { name: ['Загвар 01', 'Model 01'], note: ['Тэгш дээвэр', 'Flat roof'] },
  m2: { name: ['Загвар 02', 'Model 02'], note: ['Гаражтай', 'With garage'] },
  m3: { name: ['Загвар 03', 'Model 03'], note: ['A-frame', 'A-frame'] },
  m4: { name: ['Загвар 04', 'Model 04'], note: ['3 давхар', '3 storeys'] },
  m5: { name: ['Загвар 05', 'Model 05'], note: ['Хосолсон дээвэр', 'Mixed roof'] },
  m6: { name: ['Загвар 06', 'Model 06'], note: ['Нам, урт', 'Low and long'] },
};

export const totalArea = (m) => (m.floors ? m.floors.reduce((s, f) => s + f[1], 0) : null);

export function initModels() {
  const stage = document.getElementById('modelStage');
  if (!stage) return;
  const $ = (id) => document.getElementById(id);
  const tt = (pair) => t(pair[0], pair[1]);
  let current = 'barnhouse',
    viewer = null,
    loading = null,
    mode = 'exterior',
    profileMm = 89,
    plans = new Map();
  const detail = $('modelDetail');
  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids);
    return n;
  };

  function setPressed(sel, test) {
    document.querySelectorAll(sel).forEach((b) => {
      const on = test(b);
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function getPlan(m) {
    if (!m.plan) return Promise.resolve(null);
    if (!plans.has(m.plan))
      plans.set(
        m.plan,
        fetch(m.plan)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      );
    return plans.get(m.plan);
  }

  function renderDetail(planData) {
    const m = MODELS[current];
    detail.replaceChildren();
    const level = planData?.levels.find((l) => l.id === mode);
    if (level) {
      detail.append(
        el('div', {
          className: 'calc-label',
          textContent: t('Өрөөний зохион байгуулалт', 'Room layout'),
        }),
        el('h4', {
          textContent: tt(m.levels[level.id]) + t(' · өрөөнүүд', ' · rooms'),
        }),
      );
      const list = el('ol', { className: 'model-rooms' });
      level.rooms.forEach((r, i) => {
        const b = el(
          'button',
          { type: 'button', className: 'model-room' },
          el('span', { textContent: t(`Өрөө ${i + 1}`, `Room ${i + 1}`) }),
          el('span', { className: 'mono', textContent: r.area.toFixed(1) + t(' м²', ' m²') }),
        );
        b.dataset.level = level.id;
        b.dataset.index = String(i);
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => {
          viewer?.selectRoom(level.id, i);
          markRoom(level.id, i);
        });
        list.append(el('li', {}, b));
      });
      detail.append(
        list,
        el('p', {
          className: 'model-help',
          textContent: t(
            'Хананы дотор талаар хэмжсэн ойролцоо цэвэр талбай. Өрөөний зориулалтыг зураг төслөөр тогтооно. Шат, хонгилын талбай тусад нь орно.',
            'Approximate net areas measured inside the walls. Room use is set in the design stage. Stairs and halls are not included.',
          ),
        }),
      );
    } else if (mode === 'frame') {
      const toggle = el('div', { className: 'model-profile', role: 'group' });
      toggle.setAttribute('aria-label', t('Профилийн төрөл', 'Profile type'));
      for (const mm of [89, 140]) {
        const b = el('button', {
          type: 'button',
          className: 'model-view' + (mm === profileMm ? ' active' : ''),
          textContent: mm + t('мм профиль', ' mm profile'),
        });
        b.dataset.profile = String(mm);
        b.setAttribute('aria-pressed', String(mm === profileMm));
        b.addEventListener('click', () => setProfile(mm, true));
        toggle.append(b);
      }
      const layers = el('ul', { className: 'model-layers' });
      [
        [
          t('Хана', 'Walls'),
          t(`Хөнгөн ган профиль, ${profileMm} мм`, `Light steel studs, ${profileMm} mm`),
        ],
        [
          t('Доод, дээд хөндлөвч', 'Top and bottom tracks'),
          t('Тулгууруудыг холбоно', 'Tie the studs together'),
        ],
        [
          t('Давхар хоорондын хучилт', 'Floor structure'),
          t('2-р давхрын ган дам нуруу', 'Steel joists under the upper floor'),
        ],
        [
          t('Дулаалга, өнгөлгөө', 'Insulation and finishes'),
          t('Төслөөр сонгоно', 'Chosen per project'),
        ],
      ].forEach(([a, b]) =>
        layers.append(
          el('li', {}, el('strong', { textContent: a }), el('span', { textContent: b })),
        ),
      );
      detail.append(
        el('div', { className: 'calc-label', textContent: t('Хийцлэл', 'Construction') }),
        el('h4', { textContent: t('Хөнгөн ган каркас', 'Light steel frame') }),
        toggle,
        layers,
        el('p', {
          className: 'model-help',
          textContent: t(
            'Бүдүүвч харагдац. Тулгуурын алхам, профилийн хэмжээ, ачааллыг инженерийн тооцоогоор тогтооно.',
            'Schematic view. Stud spacing, profile size and loads are set by engineering calculation.',
          ),
        }),
      );
    }
    detail.hidden = !detail.childElementCount;
  }

  function markRoom(levelId, i) {
    setPressed('.model-room', (b) => b.dataset.level === levelId && b.dataset.index === String(i));
  }

  function setProfile(mm, syncCalc) {
    profileMm = mm;
    viewer?.profile(mm);
    if (syncCalc) document.querySelector(`.calc-type[data-type="${mm}"]`)?.click();
    if (mode === 'frame') getPlan(MODELS[current]).then(renderDetail);
  }

  function setMode(next) {
    const m = MODELS[current];
    mode = m.plan ? next : 'exterior';
    setPressed('.model-mode', (b) => b.dataset.mode === mode);
    viewer?.mode(mode);
    getPlan(m).then(renderDetail);
  }

  function status(text, image) {
    const box = $('modelStatus');
    box.hidden = !text;
    $('modelStatusText').textContent = text || '';
    let img = box.querySelector('img');
    if (image) {
      if (!img) {
        img = document.createElement('img');
        img.alt = '';
        img.width = 256;
        img.height = 256;
        box.prepend(img);
      }
      img.src = image;
    } else if (img) img.remove();
  }

  function render() {
    const m = MODELS[current],
      area = totalArea(m);
    $('modelName').textContent = tt(m.name);
    $('modelNote').textContent = tt(m.note);
    $('modelDims').textContent = m.dims || t('Концепт', 'Concept');
    const dl = $('modelAreas');
    dl.replaceChildren();
    if (area) {
      for (const [label, value] of m.floors) {
        dl.append(Object.assign(document.createElement('dt'), { textContent: tt(label) }));
        dl.append(
          Object.assign(document.createElement('dd'), {
            textContent: value.toFixed(1) + t(' м²', ' m²'),
          }),
        );
      }
      const dt = Object.assign(document.createElement('dt'), {
        textContent: t('Нийт талбай', 'Total floor area'),
        className: 'total',
      });
      const dd = Object.assign(document.createElement('dd'), {
        textContent: area.toFixed(1) + t(' м²', ' m²'),
        className: 'total',
      });
      dl.append(dt, dd);
    } else {
      dl.append(Object.assign(document.createElement('dt'), { textContent: t('Талбай', 'Area') }));
      dl.append(
        Object.assign(document.createElement('dd'), { textContent: t('Удахгүй', 'Coming soon') }),
      );
    }
    $('modelToCalc').setAttribute('aria-disabled', String(!area));
    document.querySelectorAll('.model-card').forEach((b) => {
      const on = b.dataset.model === current;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('.model-mode').forEach((b) => {
      b.disabled = !m.plan;
    });
    if (!m.plan) mode = 'exterior';
    setPressed('.model-mode', (b) => b.dataset.mode === mode);
    getPlan(m).then(renderDetail);
    if (viewer) show();
  }

  function show() {
    const m = MODELS[current];
    if (!m.file) {
      viewer.clear();
      const card = document.querySelector(`.model-card[data-model="${current}"] img`);
      status(
        t(
          'Энэ загварын 3D хувилбар удахгүй нэмэгдэнэ.',
          'The 3D version of this model is coming soon.',
        ),
        card?.currentSrc || card?.src,
      );
      return;
    }
    status(t('3D загвар ачаалж байна…', 'Loading the 3D model…'));
    getPlan(m)
      .then((plan) => viewer.load(m.file, plan))
      .then(() => {
        status('');
        viewer.profile(profileMm);
        viewer.mode(mode);
      })
      .catch(() =>
        status(
          t(
            'Загвар ачаалагдсангүй. Хуудсаа дахин ачаална уу.',
            'The model could not be loaded. Please reload the page.',
          ),
        ),
      );
  }

  function boot() {
    if (loading) return loading;
    const url = stage.dataset.viewer;
    if (!url) {
      status(t('3D харагдац энэ хуудсанд идэвхгүй.', '3D view is not available on this page.'));
      return null;
    }
    loading = import(/* @vite-ignore */ url)
      .then((mod) => {
        viewer = mod.createViewer(stage, { onRoom: markRoom });
        document.querySelectorAll('.model-view').forEach((b) =>
          b.addEventListener('click', () => {
            document.querySelectorAll('.model-view').forEach((x) => {
              x.classList.toggle('active', x === b);
              x.setAttribute('aria-pressed', String(x === b));
            });
            viewer.view(b.dataset.view);
          }),
        );
        show();
      })
      .catch(() =>
        status(
          t(
            '3D харагдац энэ төхөөрөмж дээр ачаалагдсангүй.',
            '3D view could not start on this device.',
          ),
        ),
      );
    return loading;
  }

  document.querySelectorAll('.model-card').forEach((b) =>
    b.addEventListener('click', () => {
      current = b.dataset.model;
      render();
      boot();
    }),
  );

  document.querySelectorAll('.model-mode').forEach((b) =>
    b.addEventListener('click', () => {
      setMode(b.dataset.mode);
      boot();
    }),
  );
  document.querySelectorAll('.calc-type').forEach((b) =>
    b.addEventListener('click', () => {
      const mm = Number(b.dataset.type);
      if (mm && mm !== profileMm) setProfile(mm, false);
    }),
  );

  $('modelToCalc').addEventListener('click', (e) => {
    const area = totalArea(MODELS[current]);
    if (!area) {
      e.preventDefault();
      return;
    }
    const input = $('calcAreaInput');
    if (input) {
      input.value = String(Math.min(400, Math.max(10, Math.round(area))));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const msg = $('messageInput');
    if (msg && !msg.value)
      msg.value = t(
        `Загвар: ${tt(MODELS[current].name)} (${area.toFixed(0)} м²)`,
        `Model: ${tt(MODELS[current].name)} (${area.toFixed(0)} m²)`,
      );
  });
  $('modelToQuote').addEventListener('click', () => {
    const msg = $('messageInput'),
      m = MODELS[current],
      area = totalArea(m);
    if (msg && !msg.value)
      msg.value =
        t(`Загвар: ${tt(m.name)}`, `Model: ${tt(m.name)}`) +
        (area ? ` (${area.toFixed(0)} м²)` : '');
  });

  render();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          boot();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(stage);
  } else boot();
}
