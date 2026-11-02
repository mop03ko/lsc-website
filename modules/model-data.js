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
  'a-frame': {
    name: ['A-Frame', 'A-Frame'],
    note: ['3D каталог', '3D catalog'],
    file: '/models/a-frame.glb',
  },
  'barndominium-1': {
    name: ['Barndominium 1', 'Barndominium 1'],
    note: ['3D каталог', '3D catalog'],
    file: '/models/barndominium-1.glb',
  },
  'compact-cottage': {
    name: ['Compact Cottage', 'Compact Cottage'],
    note: ['3D каталог', '3D catalog'],
    file: '/models/compact-cottage.glb',
  },
  'cottage-elevated': {
    name: ['Cottage Elevated', 'Cottage Elevated'],
    note: ['3D каталог', '3D catalog'],
    file: '/models/cottage-elevated.glb',
  },
  'japandi-contemporary': {
    name: ['Japandi Contemporary', 'Japandi Contemporary'],
    note: ['3D каталог', '3D catalog'],
    file: '/models/japandi-contemporary.glb',
  },
  'modern-standart': {
    name: ['Modern Standard', 'Modern Standard'],
    note: ['3D каталог', '3D catalog'],
    file: '/models/modern-standart.glb',
  },
};

export const totalArea = (m) => (m.floors ? m.floors.reduce((s, f) => s + f[1], 0) : null);


