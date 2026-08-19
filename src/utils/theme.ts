export type PaletteType = 'Gibson Gold' | 'Scully Red' | 'X-Files Green' | 'Cyber Blue' | 'Violet Reign' | 'Rose Quartz' | 'Midnight Teal' | 'Obsidian Silver';

export const PALETTES: Record<PaletteType, Record<string, string>> = {
  'Gibson Gold': {
    '--gold-50': '#FCFAF7',
    '--gold-100': '#EFE7DA',
    '--gold-200': '#e8c99a',
    '--gold-300': '#d4a85c',
    '--gold-400': '#C89B3C',
    '--gold-500': '#C89B3C',
    '--gold-600': '#A97828',
    '--gold-700': '#806015',
    '--gold-800': '#604818',
    '--gold-900': '#1E1E1E',
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
  },
  'Violet Reign': {
    '--gold-50': '#faf5ff',
    '--gold-100': '#f3e8ff',
    '--gold-200': '#e9d5ff',
    '--gold-300': '#d8b4fe',
    '--gold-400': '#c084fc',
    '--gold-500': '#9333ea',
    '--gold-600': '#7e22ce',
    '--gold-700': '#6b21a8',
    '--gold-800': '#581c87',
    '--gold-900': '#3b0764',
  },
  'Rose Quartz': {
    '--gold-50': '#fff1f2',
    '--gold-100': '#ffe4e6',
    '--gold-200': '#fecdd3',
    '--gold-300': '#fda4af',
    '--gold-400': '#fb7185',
    '--gold-500': '#e11d48',
    '--gold-600': '#be123c',
    '--gold-700': '#9f1239',
    '--gold-800': '#881337',
    '--gold-900': '#4c0519',
  },
  'Midnight Teal': {
    '--gold-50': '#f0fdfa',
    '--gold-100': '#ccfbf1',
    '--gold-200': '#99f6e4',
    '--gold-300': '#5eead4',
    '--gold-400': '#2dd4bf',
    '--gold-500': '#0d9488',
    '--gold-600': '#0f766e',
    '--gold-700': '#115e59',
    '--gold-800': '#134e4a',
    '--gold-900': '#042f2e',
  },
  'Obsidian Silver': {
    '--gold-50': '#f8fafc',
    '--gold-100': '#f1f5f9',
    '--gold-200': '#e2e8f0',
    '--gold-300': '#cbd5e1',
    '--gold-400': '#94a3b8',
    '--gold-500': '#64748b',
    '--gold-600': '#475569',
    '--gold-700': '#334155',
    '--gold-800': '#1e293b',
    '--gold-900': '#0f172a',
  }
};

export function applyTheme(palette: PaletteType) {
  const variables = PALETTES[palette] || PALETTES['Gibson Gold'];
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
