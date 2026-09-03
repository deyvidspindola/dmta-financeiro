import { useMemo, useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  DataTable,
  MoneyValue,
  Td,
  Tr,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'
import type { ImportPreviewStatus } from '@/types/models'

export type ImportPreviewColumn<T> = {
  key: string
  header: string
  right?: boolean
  cell: (row: T) => ReactNode
}

type SelectableRow = {
  line: number
  status: ImportPreviewStatus
  reason: string | null
}

type ImportPreviewTableProps<T extends SelectableRow> = {
  rows: T[]
  columns: ImportPreviewColumn<T>[]
  onImport: (lines: number[]) => void
  importing?: boolean
}

const i = strings.imports

function defaultSelected(rows: SelectableRow[]): Set<number> {
  return new Set(rows.filter((row) => row.status === 'ok').map((row) => row.line))
}

export function ImportPreviewTable<T extends SelectableRow>({
  rows,
  columns,
  onImport,
  importing = false,
}: ImportPreviewTableProps<T>) {
  const rowsKey = rows.map((row) => `${row.line}:${row.status}`).join('|')
  const selectableLines = useMemo(
    () => rows.filter((row) => row.status !== 'invalid').map((row) => row.line),
    [rows],
  )

  const [selection, setSelection] = useState<{
    key: string
    selected: Set<number>
  }>(() => ({ key: rowsKey, selected: defaultSelected(rows) }))

  const selected =
    selection.key === rowsKey ? selection.selected : defaultSelected(rows)

  function setSelected(next: Set<number>): void {
    setSelection({ key: rowsKey, selected: next })
  }

  const allSelected =
    selectableLines.length > 0 &&
    selectableLines.every((line) => selected.has(line))

  function toggleAll(): void {
    setSelected(allSelected ? new Set() : new Set(selectableLines))
  }

  function toggleLine(line: number, enabled: boolean): void {
    const next = new Set(selected)
    if (enabled) next.add(line)
    else next.delete(line)
    setSelected(next)
  }

  const selectedCount = selected.size
  const headers = [
    '',
    ...columns.map((column) =>
      column.right ? { label: column.header, right: true } : column.header,
    ),
    i.status,
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-muted">
          {i.willImport(selectedCount, rows.length)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={toggleAll}
            disabled={selectableLines.length === 0}
          >
            {allSelected ? i.deselectAll : i.selectAll}
          </Button>
          <Button
            onClick={() => onImport([...selected].sort((a, b) => a - b))}
            disabled={selectedCount === 0 || importing}
            loading={importing}
          >
            {i.importSelected}
          </Button>
        </div>
      </div>

      <DataTable headers={headers}>
        {rows.map((row) => {
          const disabled = row.status === 'invalid'
          const checked = selected.has(row.line)

          return (
            <Tr
              key={row.line}
              className={cn(row.status === 'invalid' && 'bg-negative/5')}
            >
              <Td>
                <input
                  type="checkbox"
                  className="size-4 rounded border-line text-brand-600 focus:ring-brand-600 disabled:opacity-40"
                  checked={checked}
                  disabled={disabled}
                  aria-label={`${i.selectRow} ${row.line}`}
                  onChange={(event) =>
                    toggleLine(row.line, event.target.checked)
                  }
                />
              </Td>
              {columns.map((column) => (
                <Td key={column.key} right={column.right}>
                  {column.cell(row)}
                </Td>
              ))}
              <Td>
                <StatusBadge status={row.status} reason={row.reason} />
              </Td>
            </Tr>
          )
        })}
      </DataTable>
    </div>
  )
}

function StatusBadge({
  status,
  reason,
}: {
  status: ImportPreviewStatus
  reason: string | null
}) {
  if (status === 'ok') {
    return <Badge tone="success">{i.statusOk}</Badge>
  }

  if (status === 'duplicate') {
    return (
      <span title={reason ?? undefined}>
        <Badge tone="warning">{i.statusDuplicate}</Badge>
      </span>
    )
  }

  return (
    <span className="inline-flex flex-col gap-0.5" title={reason ?? undefined}>
      <Badge tone="danger">{i.statusInvalid}</Badge>
      {reason ? (
        <span className="max-w-40 text-xs text-fg-muted">{reason}</span>
      ) : null}
    </span>
  )
}

/** Helper pra MoneyValue a partir de valor com sinal ou direção. */
export function previewMoney(
  amount: number,
  direction: 'credit' | 'debit',
): ReactNode {
  return <MoneyValue amount={Math.abs(amount)} direction={direction} />
}
