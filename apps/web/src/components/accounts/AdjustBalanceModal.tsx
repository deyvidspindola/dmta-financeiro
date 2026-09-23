import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsApi } from '@/api'
import { Button, Modal, MoneyInput } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { currentMonthKey } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { toastSuccess } from '@/store/toastStore'
import type { Account } from '@/types/models'

const t = strings.accountDetail

type AdjustBalanceModalProps = {
  account: Account
  contextId: string
  onClose: () => void
}

/**
 * Reajusta o saldo da conta (mesmo fluxo do app): o usuário informa o
 * saldo real de hoje e a diferença vira um lançamento efetivado de
 * "Ajuste de saldo" — receita se o saldo subiu, despesa se desceu.
 */
export function AdjustBalanceModal({ account, contextId, onClose }: AdjustBalanceModalProps) {
  const queryClient = useQueryClient()
  const [target, setTarget] = useState(account.balance)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (value: number) => {
      const diff = Math.round((value - account.balance) * 100) / 100
      if (diff === 0) throw new Error(t.adjustBalanceSame)
      const today = `${currentMonthKey()}-${String(new Date().getDate()).padStart(2, '0')}`
      return transactionsApi.createTransaction(contextId, {
        account_id: account.id,
        category_id: null,
        description: t.adjustBalanceDescription,
        amount: Math.abs(diff),
        type: diff > 0 ? 'income' : 'expense',
        date: today,
        settled: true,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(t.adjustBalanceSuccess)
      onClose()
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  return (
    <Modal
      title={t.adjustBalance}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {strings.common.cancel}
          </Button>
          <Button
            onClick={() => {
              setError(null)
              mutation.mutate(target)
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? strings.common.loading : t.adjustBalanceSubmit}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-fg-muted">{t.adjustBalanceHint}</p>
        <div className="space-y-1.5">
          <label htmlFor="adjust-balance-input" className="block text-sm font-medium text-fg">
            {t.adjustBalanceNewBalance}
          </label>
          <MoneyInput
            id="adjust-balance-input"
            value={target}
            onChange={setTarget}
            disabled={mutation.isPending}
          />
        </div>
        {error ? <p className="text-sm text-negative">{error}</p> : null}
      </div>
    </Modal>
  )
}
