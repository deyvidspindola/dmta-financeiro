import type { ReactNode } from 'react'
import { Alert } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'

type FailedRow = { row: number; reason: string }

type ImportResultProps = {
  imported: number
  duplicates?: number
  failed: FailedRow[]
}

export function ImportResult({
  imported,
  duplicates,
  failed,
}: ImportResultProps) {
  const i = strings.imports
  const tone = failed.length > 0 ? 'warning' : 'success'

  return (
    <Alert tone={tone} title={i.summary}>
      <p>
        {i.imported}: {imported}
        {duplicates !== undefined ? ` · ${i.duplicates}: ${duplicates}` : null}
        {' · '}
        {i.failed}: {failed.length}
      </p>
      {failed.length > 0 ? (
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm">
          {failed.map((row) => (
            <li key={`${row.row}-${row.reason}`}>
              {i.failedRow} {row.row}: {row.reason}
            </li>
          ))}
        </ul>
      ) : null}
    </Alert>
  )
}

export function CsvFileField({
  file,
  onChange,
  disabled,
  accept = '.csv,text/csv',
  label,
  hint,
}: {
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
  accept?: string
  label?: string
  hint?: string
}) {
  const i = strings.imports
  const id = 'csv-file-input'

  return (
    <FieldLike label={label ?? i.file}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label
          htmlFor={id}
          className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-line bg-surface-2 px-4 py-2 text-sm font-medium text-fg transition hover:bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600"
        >
          {i.chooseFile}
          <input
            id={id}
            type="file"
            accept={accept}
            className="sr-only"
            disabled={disabled}
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          />
        </label>
        <span className="text-sm text-fg-muted" aria-live="polite">
          {file?.name ?? i.noFileSelected}
        </span>
      </div>
      {hint ? <span className="text-xs text-fg-subtle">{hint}</span> : null}
    </FieldLike>
  )
}

function FieldLike({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg">{label}</span>
      {children}
    </div>
  )
}
