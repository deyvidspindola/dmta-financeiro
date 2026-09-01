/**
 * Tokens de tema do apps/app — alinhados ao apps/web (src/styles/theme.css:
 * --color-brand-*, --color-accent-*, --color-cat-*). NativeWind 4 / Tailwind 3.
 *
 * Cores semânticas (canvas/surface/fg/line/positive/negative) trocam com o
 * tema via CSS vars definidas em src/styles/global.css.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primária — verde "dinheiro" tipo Mobills
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Acento — dados, gráficos, destaques (violeta)
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Paleta de categorias
        cat: {
          1: '#10b981',
          2: '#3b82f6',
          3: '#8b5cf6',
          4: '#ec4899',
          5: '#f97316',
          6: '#eab308',
          7: '#14b8a6',
          8: '#6366f1',
          9: '#ef4444',
          10: '#06b6d4',
          11: '#84cc16',
          12: '#a855f7',
        },
        // Semânticas — resolvem CSS vars de global.css (trocam com o tema)
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        fg: {
          DEFAULT: 'var(--fg)',
          muted: 'var(--fg-muted)',
          subtle: 'var(--fg-subtle)',
        },
        positive: 'var(--positive)',
        negative: 'var(--negative)',
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
