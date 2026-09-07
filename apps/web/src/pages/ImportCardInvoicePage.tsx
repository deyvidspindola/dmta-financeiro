import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { billCapturesApi, creditCardsApi } from '@/api'
import { CsvFileField, ImportResult } from '@/components/imports/ImportFields'
import {
  ImportPreviewTable,
  previewMoney,
  type ImportPreviewColumn,
} from '@/components/imports/ImportPreviewTable'
import {
  Button,
  Card,
  CardHeader,
  ErrorBanner,
  Field,
  PageHeader,
  SwitchField,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type {
  CardInvoiceImportPreview,
  CardInvoiceImportPreviewRow,
  CardInvoiceImportSummary,
} from '@/types/models'

const i = strings.imports

const columns: ImportPreviewColumn<CardInvoiceImportPreviewRow>[] = [
  {
    key: 'date',
    header: i.colDate,
    cell: (row) => row.parsed?.occurred_at ?? '—',
  },
  {
    key: 'description',
    header: i.colDescription,
    cell: (row) => {
      const p = row.parsed
      const base = p?.description ?? row.raw.descricao ?? '—'
      if (!p?.installment_total) return base
      const future = Math.max(0, p.installments_pending - 1)
      return (
        <span>
          {base}{' '}
          <span className="text-xs text-fg-muted">
            {i.installmentNote(p.installment_number ?? 0, p.installment_total, future)}
          </span>
        </span>
      )
    },
  },
  {
    key: 'amount',
    header: i.colAmount,
    right: true,
    cell: (row) => {
      if (!row.parsed) return '—'
      return previewMoney(row.parsed.amount, 'debit')
    },
  },
  {
    key: 'category',
    header: i.colCategory,
    cell: (row) => row.parsed?.category_name ?? '—',
  },
]

export function ImportCardInvoicePage() {
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = activeScope === CONSOLIDATED ? null : activeScope
  const [cardId, setCardId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [savePassword, setSavePassword] = useState(false)
  const [preview, setPreview] = useState<CardInvoiceImportPreview | null>(null)
  const [summary, setSummary] = useState<CardInvoiceImportSummary | null>(null)

  const cardsQuery = useQuery({
    queryKey: ['credit-cards', contextId],
    queryFn: () => creditCardsApi.listCreditCards(contextId!),
    enabled: Boolean(contextId),
  })

  const templateMutation = useMutation({
    mutationFn: () =>
      creditCardsApi.downloadInvoiceTemplate(contextId!, cardId),
  })

  const previewMutation = useMutation({
    mutationFn: (pwd: string) =>
      creditCardsApi.previewInvoice(contextId!, cardId, file!, pwd || undefined),
    onSuccess: async (result, pwd) => {
      setPreview(result)
      setSummary(null)
      if (!result.needs_password && pwd && savePassword) {
        // `card-invoice` é um domínio sentinela: a importação de fatura
        // tenta TODAS as regras (`resolveAllCandidates`), então a senha
        // volta a ser usada aqui — mas sem cair no `*`, que faria o motor
        // de e-mail tentar essa senha em todo boleto recebido.
        await billCapturesApi
          .saveBoletoPasswordRule({
            sender_domain: 'card-invoice',
            rule_type: 'fixed',
            rule_params: { password: pwd },
            label: i.pdfSavePasswordLabel,
          })
          .then(() => toastSuccess(i.passwordRuleSaved))
          .catch(() => undefined)
        setSavePassword(false)
      }
    },
  })

  const importMutation = useMutation({
    mutationFn: (lines: number[]) =>
      creditCardsApi.importInvoice(
        contextId!,
        cardId,
        file!,
        lines,
        password || undefined,
      ),
    onSuccess: (result) => {
      setSummary(result)
      setPreview(null)
      toastSuccess(i.done)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  useEffect(() => {
    if (!contextId || !cardId || !file || summary) return
    setPassword('')
    previewMutation.mutate('')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só quando arquivo/cartão mudam
  }, [contextId, cardId, file])

  function resetForAnother(): void {
    setFile(null)
    setPassword('')
    setSavePassword(false)
    setPreview(null)
    setSummary(null)
    previewMutation.reset()
    importMutation.reset()
  }

  const cards = cardsQuery.data ?? []
  const needsPassword = preview?.needs_password ?? false

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={i.cardInvoiceTitle}
        description={i.cardInvoiceHint}
        actions={
          <Button
            variant="ghost"
            onClick={() => templateMutation.mutate()}
            disabled={!contextId || !cardId || templateMutation.isPending}
          >
            {i.downloadTemplate}
          </Button>
        }
      />

      {!contextId ? <ErrorBanner message={i.needContext} /> : null}

      {!summary ? (
        <Card>
          <CardHeader title={i.instructions} description={i.cardInvoiceHint} />
          <div className="space-y-4">
            <Field label={i.creditCard}>
              <TextSelect
                value={cardId}
                onChange={(event) => {
                  setCardId(event.target.value)
                  setPreview(null)
                }}
                disabled={!contextId}
              >
                <option value="">{strings.common.select}</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <CsvFileField
              file={file}
              accept=".csv,text/csv,.pdf,application/pdf"
              hint={i.cardInvoiceFileHint}
              onChange={(next) => {
                setFile(next)
                setPreview(null)
              }}
              disabled={!contextId}
            />
            <p className="text-xs text-fg-subtle">
              {i.cardInvoiceInstallmentsHint}
            </p>
            {previewMutation.isPending ? (
              <p className="text-sm text-fg-muted">{i.loadingPreview}</p>
            ) : null}

            {needsPassword ? (
              <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-4">
                <p className="text-sm text-fg">
                  {preview?.unsupported ? i.pdfUnsupported : i.pdfNeedsPassword}
                </p>
                {!preview?.unsupported ? (
                  <>
                    <Field label={i.pdfPassword}>
                      <TextInput
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="off"
                      />
                    </Field>
                    <SwitchField
                      checked={savePassword}
                      onChange={setSavePassword}
                      label={i.pdfSavePassword}
                    />
                    <Button
                      onClick={() => previewMutation.mutate(password)}
                      disabled={!password || previewMutation.isPending}
                    >
                      {i.pdfUnlock}
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {previewMutation.isError ? (
        <ErrorBanner message={getErrorMessage(previewMutation.error)} />
      ) : null}
      {importMutation.isError ? (
        <ErrorBanner message={getErrorMessage(importMutation.error)} />
      ) : null}

      {preview && !needsPassword && !summary && preview.rows.length > 0 ? (
        <Card>
          <CardHeader title={i.previewTitle} />
          <ImportPreviewTable
            rows={preview.rows}
            columns={columns}
            importing={importMutation.isPending}
            onImport={(lines) => importMutation.mutate(lines)}
          />
          {preview.raw_text ? <RawTextDetails text={preview.raw_text} /> : null}
        </Card>
      ) : null}

      {preview && !needsPassword && !summary && preview.rows.length === 0 ? (
        <Card>
          <CardHeader title={i.previewTitle} />
          <div className="space-y-3">
            <ErrorBanner message={i.pdfNoRows} />
            {preview.raw_text !== null ? (
              <RawTextDetails text={preview.raw_text || i.pdfNoText} defaultOpen />
            ) : null}
          </div>
        </Card>
      ) : null}

      {summary ? (
        <div className="space-y-4">
          <ImportResult
            imported={summary.imported}
            duplicates={summary.duplicates}
            failed={summary.failed}
          />
          <Button variant="secondary" onClick={resetForAnother}>
            {i.importAnother}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function RawTextDetails({
  text,
  defaultOpen = false,
}: {
  text: string
  defaultOpen?: boolean
}) {
  return (
    <details className="mt-4 rounded-xl border border-line bg-surface-2 p-3" open={defaultOpen}>
      <summary className="cursor-pointer text-sm font-medium text-fg">
        {strings.imports.pdfExtractedText}
      </summary>
      <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-fg-muted">
        {text}
      </pre>
    </details>
  )
}
