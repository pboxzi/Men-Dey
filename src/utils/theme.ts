export type PaletteType = 'Gibson Gold' | 'Scully Red' | 'X-Files Green' | 'Cyber Blue';

export const PALETTES: Record<PaletteType, Record<string, string>> = {
  'Gibson Gold': {
    '--gold-50': '#faf6ef',
    '--gold-100': '#f3e9d8',
    '--gold-200': '#e7d2b2',
    '--gold-300': '#d6b484',
    '--gold-400': '#c5975d',
    '--gold-500': '#dfba89',
    '--gold-600': '#c5a880',
    '--gold-700': '#9e815b',
    '--gold-800': '#7c6446',
    '--gold-900': '#554430',
  },
  'Scully Red': {
    '--gold-50': '#fff5f5',
    '--gold-100': '#ffe3e3',
    '--gold-200': '#ffc9c9',
    '--gold-300': '#ffa8a8',
    '--gold-400': '#ff8787',
    '--gold-500': '#dc2626',
    '--gold-600': '#b91c1c',
    '--gold-700': '#991b1b',
    '--gold-800': '#7f1d1d',
    '--gold-900': '#450a0a',
  },
  'X-Files Green': {
    '--gold-50': '#f0fdf4',
    '--gold-100': '#dcfce7',
    '--gold-200': '#bbf7d0',
    '--gold-300': '#86efac',
    '--gold-400': '#4ade80',
    '--gold-500': '#16a34a',
    '--gold-600': '#15803d',
    '--gold-700': '#166534',
    '--gold-800': '#14532d',
    '--gold-900': '#052e16',
  },
  'Cyber Blue': {
    '--gold-50': '#f0f9ff',
    '--gold-100': '#e0f2fe',
    '--gold-200': '#bae6fd',
    '--gold-300': '#7dd3fc',
    '--gold-400': '#38bdf8',
    '--gold-500': '#0284c7',
    '--gold-600': '#0369a1',
    '--gold-700': '#075985',
    '--gold-800': '#0c4a6e',
    '--gold-900': '#082f49',
  }
};

export function applyTheme(palette: PaletteType) {
  const variables = PALETTES[palette] || PALETTES['Gibson Gold'];
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
