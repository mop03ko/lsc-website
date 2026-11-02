import { t } from '../i18n.js';

import { MODELS, totalArea } from './model-data.js';

export function initModels() {
  const stage = document.getElementById('modelStage');
  if (!stage) return;
  const $ = (id) => document.getElementById(id);
  const tt = (pair) => t(pair[0], pair[1]);
  const requestedModel = new URL(location.href).searchParams.get('model');
  let current = Object.hasOwn(MODELS, requestedModel) ? requestedModel : 'barnhouse',
    viewer = null,
    loading = null,
    generatedMessage = '',
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
    getPlan(m).then((plan) => {
      if (MODELS[current] === m) renderDetail(plan);
    });
  }

  function status(text, image) {
    const box = $('modelStatus');
    box.hidden = !text;
    $('modelRetry').hidden = stage.getAttribute('aria-busy') === 'true';
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
    $('modelDownload').href = m.file;
    $('modelToCalc').hidden = !area;
    $('modelNote').textContent = tt(m.note);
    $('modelAvailability').textContent = m.plan
      ? t(
          'Талбай, давхрын план, бүдүүвч карказ үзэх боломжтой.',
          'Area, floor layouts and a schematic frame are available.',
        )
      : t(
          'Одоогоор гадна төрхийн 3D загвар. Баталгаатай м², давхрын план, карказын зураг дараа нэмэгдэнэ.',
          'Exterior 3D model available. Confirmed floor area, layouts and structural drawings will be added later.',
        );
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
        Object.assign(document.createElement('dd'), {
          textContent: t('Зургаар батална', 'Confirm with drawings'),
        }),
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
    document.querySelector('.model-modes').hidden = !m.plan;
    if (!m.plan) mode = 'exterior';
    setPressed('.model-mode', (b) => b.dataset.mode === mode);
    getPlan(m).then((plan) => {
      if (MODELS[current] === m) renderDetail(plan);
    });
    if (viewer) show();
  }

  function show() {
    const selected = current;
    const m = MODELS[current];
    stage.setAttribute('aria-busy', 'true');
    delete stage.dataset.loaded;
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
      .then((plan) => (selected === current ? viewer.load(m.file, plan) : false))
      .then((loaded) => {
        if (loaded && selected === current) {
          status('');
          viewer.profile(profileMm);
          viewer.mode(mode);
          stage.setAttribute('aria-busy', 'false');
        }
      })
      .catch((error) => {
        if (selected !== current || error.name === 'AbortError') return;
        stage.setAttribute('aria-busy', 'false');
        status(
          t(
            'Загвар ачаалагдсангүй. Хуудсаа дахин ачаална уу.',
            'The model could not be loaded. Select Try again.',
          ),
        );
      });
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
        document.querySelectorAll('.model-view[data-view]').forEach((b) =>
          b.addEventListener('click', () => {
            document.querySelectorAll('.model-view[data-view]').forEach((x) => {
              x.classList.toggle('active', x === b);
              x.setAttribute('aria-pressed', String(x === b));
            });
            viewer.view(b.dataset.view);
          }),
        );
        show();
      })
      .catch(() => {
        stage.setAttribute('aria-busy', 'false');
        status(
          t(
            '3D харагдац энэ төхөөрөмж дээр ачаалагдсангүй.',
            '3D view could not start on this device.',
          ),
        );
      });
    return loading;
  }

  document.querySelectorAll('.model-card').forEach((b) =>
    b.addEventListener('click', () => {
      if (current === b.dataset.model && viewer) {
        $('modelStage').scrollIntoView({ block: 'center' });
        return;
      }
      current = b.dataset.model;
      const url = new URL(location.href);
      url.searchParams.set('model', current);
      history.replaceState(null, '', url);
      render();
      boot();
      $('modelStage').scrollIntoView({ block: 'center' });
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
    if (msg && (!msg.value || msg.value === generatedMessage))
      msg.value = generatedMessage = t(
        `Загвар: ${tt(MODELS[current].name)} (${area.toFixed(0)} м²)`,
        `Model: ${tt(MODELS[current].name)} (${area.toFixed(0)} m²)`,
      );
  });
  $('modelToQuote').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('lsc:quote-selected', { detail: null }));
    const msg = $('messageInput'),
      m = MODELS[current],
      area = totalArea(m);
    if (msg && (!msg.value || msg.value === generatedMessage))
      msg.value = generatedMessage =
        t(`Загвар: ${tt(m.name)}`, `Model: ${tt(m.name)}`) +
        (area ? ` (${area.toFixed(0)} м²)` : '');
  });

  $('modelRetry')?.addEventListener('click', () => {
    if (viewer) show();
    else {
      loading = null;
      boot();
    }
  });
  $('modelSearch')?.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLocaleLowerCase();
    let count = 0;
    document.querySelectorAll('.model-card').forEach((card) => {
      const match = card.textContent.toLocaleLowerCase().includes(query);
      card.closest('li').hidden = !match;
      if (match) count++;
    });
    $('modelCount').textContent = t(`${count} загвар`, `${count} models`);
    $('modelEmpty').hidden = count !== 0;
  });
  $('modelSearchReset').addEventListener('click', () => {
    $('modelSearch').value = '';
    $('modelSearch').dispatchEvent(new Event('input'));
    $('modelSearch').focus();
  });
  document
    .querySelectorAll('[data-zoom]')
    .forEach((b) =>
      b.addEventListener('click', () => viewer?.zoom(b.dataset.zoom === 'in' ? 0.8 : 1.25)),
    );
  $('modelReset').addEventListener('click', () => {
    viewer?.view('iso');
    setPressed('.model-view[data-view]', (b) => b.dataset.view === 'iso');
  });
  $('modelShare').addEventListener('click', async () => {
    const url = new URL(location.href);
    url.searchParams.set('model', current);
    url.hash = 'models';
    try {
      await navigator.clipboard.writeText(url.href);
      $('modelShareStatus').textContent = t('Холбоос хууллаа.', 'Link copied.');
    } catch {
      const link = el('a', { href: url.href, textContent: url.href });
      $('modelShareStatus').replaceChildren(link);
    }
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
