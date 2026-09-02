import { Monitor, Moon, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'
import { useThemeStore, type ThemePref } from '@/store/themeStore'

export const THEME_OPTIONS: {
  value: ThemePref
  label: string
  icon: LucideIcon
}[] = [
  { value: 'light', label: strings.theme.light, icon: Sun },
  { value: 'dark', label: strings.theme.dark, icon: Moon },
  { value: 'system', label: strings.theme.system, icon: Monitor },
]

type ThemeToggleGroupProps = {
  /** Sidebar recolhida: só ícones, empilhados verticalmente. */
  compact?: boolean
  className?: string
}

export function ThemeToggleGroup({
  compact = false,
  className,
}: ThemeToggleGroupProps) {
  const { pref, setPref } = useThemeStore()

  return (
    <div
      className={cn(
        'flex gap-0.5 rounded-xl bg-surface-2 p-1',
        compact && 'flex-col',
        className,
      )}
      role="group"
      aria-label={strings.theme.label}
    >
      {THEME_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.label}
          aria-label={opt.label}
          aria-pressed={pref === opt.value}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600',
            pref === opt.value
              ? 'bg-surface text-brand-700 shadow-sm dark:text-brand-300'
              : 'text-fg-muted hover:text-fg',
          )}
          onClick={() => setPref(opt.value)}
        >
          <opt.icon size={14} aria-hidden />
          {!compact ? <span>{opt.label}</span> : null}
        </button>
      ))}
    </div>
  )
}
