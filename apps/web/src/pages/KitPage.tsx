import type { ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'

/*
 * Vitrine viva do tema (Fase 0) e, a partir da Fase 1, do design system.
 * Rota `/kit` — só montada em desenvolvimento (ver App.tsx). Página interna
 * de verificação visual: textos em PT-BR direto aqui são aceitáveis por ser
 * ferramenta de dev, não tela de produto.
 *
 * Os swatches usam `style={{ ... var(--color-*) }}` de propósito: o Tailwind
 * v4 só gera utilitários de classes que aparecem LITERAIS no código, então
 * `bg-${prefix}-${step}` montado em runtime não existiria. Componentes reais
 * (Fase 1+) usam classes literais ou mapa de literais — ver apps/web/CLAUDE.md.
 */
export function KitPage() {
  const { pref, setPref, toggle } = useThemeStore()

  return (
    <div className="min-h-screen bg-canvas px-6 py-10 font-sans text-fg">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Design tokens — Fase 0
            </h1>
            <p className="text-sm text-fg-muted">Tailwind v4 + Preline UI</p>
          </div>
          <div className="flex items-center gap-2">
            {(['system', 'light', 'dark'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPref(p)}
                className={
                  pref === p
                    ? 'rounded-lg border border-brand-600 bg-brand-600 px-3 py-1.5 text-sm text-white'
                    : 'rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg-muted transition hover:text-fg'
                }
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-700"
            >
              toggle
            </button>
          </div>
        </header>

        <Section title="Marca — brand">
          <Ramp varName="brand" />
        </Section>

        <Section title="Acento — accent">
          <Ramp varName="accent" />
        </Section>

        <Section title="Superfícies (trocam com o tema)">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['canvas', 'surface', 'surface-2', 'line'] as const).map((t) => (
              <div
                key={t}
                className="flex h-20 items-end rounded-xl border border-line p-2 text-xs text-fg-muted"
                style={{ backgroundColor: `var(--${t})` }}
              >
                {t}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Categorias">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  color: `var(--color-cat-${n})`,
                  backgroundColor: `color-mix(in oklab, var(--color-cat-${n}) 14%, transparent)`,
                }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: `var(--color-cat-${n})` }}
                />
                cat-{n}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Botões (utilitários Tailwind + tokens de marca)">
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-card transition hover:bg-brand-700">
              Primário
            </button>
            <button className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface-2">
              Secundário
            </button>
            <button className="rounded-xl px-4 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg">
              Fantasma
            </button>
            <button className="rounded-xl bg-negative px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
              Perigo
            </button>
          </div>
        </Section>

        <Section title="Preline — dropdown (prova de que o JS liga a cada rota)">
          <div className="hs-dropdown relative inline-flex">
            <button
              type="button"
              className="hs-dropdown-toggle inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium shadow-card hover:bg-surface-2"
            >
              Abrir menu
              <svg
                className="size-4 transition hs-dropdown-open:rotate-180"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div className="hs-dropdown-menu z-10 hidden min-w-48 rounded-xl border border-line bg-surface p-1 opacity-0 shadow-pop transition-[opacity,margin] hs-dropdown-open:opacity-100">
              {['Item um', 'Item dois', 'Item três'].map((i) => (
                <button
                  key={i}
                  type="button"
                  className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-surface-2 hover:text-fg"
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Valores">
          <div className="flex flex-wrap items-center gap-6 tabular-nums">
            <span className="text-2xl font-semibold text-positive">
              + R$ 4.280,00
            </span>
            <span className="text-2xl font-semibold text-negative">
              − R$ 1.135,90
            </span>
            <span className="font-mono text-lg text-fg-muted">R$ 12.345,67</span>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
        {title}
      </h2>
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        {children}
      </div>
    </section>
  )
}

function Ramp({ varName }: { varName: 'brand' | 'accent' }) {
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map((s) => (
        <div key={s} className="flex flex-col items-center gap-1">
          <div
            className="size-12 rounded-lg border border-black/5"
            style={{ backgroundColor: `var(--color-${varName}-${s})` }}
          />
          <span className="text-[10px] text-fg-subtle">{s}</span>
        </div>
      ))}
    </div>
  )
}
