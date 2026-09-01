import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { creditCardsApi } from '@/api'
import {
  CardFormModal,
  PurchaseModal,
} from '@/components/creditCards/CreditCardModals'
import { VisualCreditCard } from '@/components/creditCards/VisualCreditCard'
import {
  Button,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'

const t = strings.creditCards

export function CreditCardsPage() {
  const queryClient = useQueryClient()
  const contextId = useWritableContextId()
  const activeScope = useAuthStore((s) => s.activeScope)
  const consolidated = activeScope === CONSOLIDATED

  const [cardModal, setCardModal] = useState<{ editing: null } | null>(null)
  const [purchaseModal, setPurchaseModal] = useState(false)

  const cards = useQuery({
    queryKey: ['credit-cards', contextId],
    queryFn: () => creditCardsApi.listCreditCards(contextId as string),
    enabled: Boolean(contextId) && !consolidated,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
    void queryClient.invalidateQueries({ queryKey: ['card-invoices'] })
    void queryClient.invalidateQueries({ queryKey: ['card-purchases'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    void queryClient.invalidateQueries({ queryKey: ['accounts'] })
  }

  if (!contextId || consolidated) {
    return (
      <div className="bg-canvas text-fg">
        <PageHeader title={t.title} />
        <ErrorBanner message={t.pickContext} />
      </div>
    )
  }

  const rows = cards.data ?? []

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={t.title}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setPurchaseModal(true)}
              disabled={rows.length === 0}
            >
              <Plus size={16} /> {t.newPurchase}
            </Button>
            <Button onClick={() => setCardModal({ editing: null })}>
              <Plus size={16} /> {t.create}
            </Button>
          </>
        }
      />

      {cards.isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {cards.isError ? <ErrorBanner message={getErrorMessage(cards.error)} /> : null}
      {!cards.isLoading && rows.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((card) => (
          <Link
            key={card.id}
            to={`/credit-cards/${card.id}`}
            className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <VisualCreditCard card={card} />
          </Link>
        ))}
      </div>

      {cardModal ? (
        <CardFormModal
          contextId={contextId}
          editing={cardModal.editing}
          onClose={() => setCardModal(null)}
          onSaved={() => {
            invalidate()
            setCardModal(null)
          }}
        />
      ) : null}

      {purchaseModal ? (
        <PurchaseModal
          contextId={contextId}
          cards={rows}
          onClose={() => setPurchaseModal(false)}
          onSaved={() => {
            invalidate()
            setPurchaseModal(false)
          }}
        />
      ) : null}
    </div>
  )
}
