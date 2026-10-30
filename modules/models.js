import { t } from '../i18n.js';

/* Area: gross floor area measured from the 3D model (m²). file: served from /models/. */
export const MODELS = {
  barnhouse: {
    name: ['Барнхаус', 'Barnhouse'],
    note: ['2 давхар · гараж', '2 storeys · garage'],
    file: '/models/barnhouse-1.glb',
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
    loading = null;

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
          Object.assign(document.createElement('dd'), { textContent: value.toFixed(1) + ' м²' }),
        );
      }
      const dt = Object.assign(document.createElement('dt'), {
        textContent: t('Нийт талбай', 'Total floor area'),
        className: 'total',
      });
      const dd = Object.assign(document.createElement('dd'), {
        textContent: area.toFixed(1) + ' м²',
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
    viewer
      .load(m.file)
      .then(() => status(''))
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
        viewer = mod.createViewer(stage);
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
