import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  ArrowRight,
  Check,
  CreditCard,
  Plus,
  ShoppingCart,
  Trash2,
  Wallet,
} from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  CategoryChip,
  DataTable,
  EmptyState,
  Field,
  IconButton,
  LoadingBlock,
  Modal,
  MoneyValue,
  ProgressBar,
  ProgressRing,
  Skeleton,
  Stat,
  Tabs,
  Td,
  TextInput,
  TextSelect,
  Tr,
} from '@/components/ui'
import { useThemeStore } from '@/store/themeStore'

/*
 * Vitrine viva do design system (Fase 1). Rota `/kit` — só em dev (App.tsx).
 * PT-BR direto aqui é ok: ferramenta de dev, não tela de produto.
 */
export function KitPage() {
  const { pref, setPref } = useThemeStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab] = useState<'todos' | 'pendentes' | 'pagos'>('todos')

  return (
    <div className="min-h-screen bg-canvas px-6 py-10 font-sans text-fg">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Design system — Fase 1
            </h1>
            <p className="text-sm text-fg-muted">
              Tailwind v4 + Preline UI · `@/components/ui`
            </p>
          </div>
          <div className="flex gap-1">
            {(['system', 'light', 'dark'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPref(p)}
                className={
                  pref === p
                    ? 'rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white'
                    : 'rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg-muted hover:text-fg'
                }
              >
                {p}
              </button>
            ))}
          </div>
        </header>

        <Section title="Botões">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="subtle" icon={Plus}>
              Sutil
            </Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="danger" icon={Trash2}>
              Excluir
            </Button>
            <Button loading>Salvando</Button>
            <Button size="sm" iconRight={ArrowRight}>
              Pequeno
            </Button>
            <Button size="lg">Grande</Button>
            <IconButton label="Adicionar" icon={Plus} variant="secondary" />
            <IconButton label="Remover" icon={Trash2} variant="danger" />
          </div>
        </Section>

        <Section title="Indicadores (Stat)">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Saldo total"
              value="R$ 12.480,55"
              icon={Wallet}
              tone="brand"
            />
            <Stat
              label="Receitas do mês"
              value="R$ 8.200,00"
              tone="positive"
              delta={{ value: '12%', direction: 'up' }}
            />
            <Stat
              label="Despesas do mês"
              value="R$ 5.964,10"
              tone="negative"
              delta={{ value: '4%', direction: 'down' }}
            />
            <Stat
              label="Faturas abertas"
              value="R$ 2.130,00"
              icon={CreditCard}
              hint="2 cartões"
              onClick={() => undefined}
            />
          </div>
        </Section>

        <Section title="Valores, badges e categorias">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-5">
              <MoneyValue amount={4280} direction="credit" size="lg" />
              <MoneyValue amount={1135.9} direction="debit" size="lg" />
              <MoneyValue amount={42.5} direction="debit" size="sm" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">Marca</Badge>
              <Badge tone="success" icon={Check}>
                Pago
              </Badge>
              <Badge tone="warning">Pendente</Badge>
              <Badge tone="danger">Vencido</Badge>
              <Badge tone="info">Recorrente</Badge>
              <Badge tone="neutral" dot>
                Manual
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ['Mercado', 1, ShoppingCart],
                ['Transporte', 5, undefined],
                ['Salário', 7, undefined],
                ['Lazer', 3, undefined],
                ['Moradia', 9, undefined],
              ].map(([name, i, Icon]) => (
                <CategoryChip
                  key={name as string}
                  name={name as string}
                  colorIndex={i as number}
                  icon={Icon as never}
                />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Progresso">
          <div className="flex flex-wrap items-center gap-8">
            <div className="w-64 space-y-3">
              <ProgressBar value={42} label="Alimentação" />
              <ProgressBar value={78} tone="warning" />
              <ProgressBar value={112} tone="negative" />
            </div>
            <ProgressRing value={65} size={72}>
              65%
            </ProgressRing>
            <ProgressRing value={90} size={72} tone="positive">
              90%
            </ProgressRing>
          </div>
        </Section>

        <Section title="Abas / segmentado">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'todos', label: 'Todos', count: 24 },
              { value: 'pendentes', label: 'Pendentes', count: 5 },
              { value: 'pagos', label: 'Pagos' },
            ]}
          />
        </Section>

        <Section title="Formulário">
          <div className="grid max-w-md gap-4">
            <Field label="Descrição" required>
              <TextInput placeholder="Ex.: Mercado do mês" />
            </Field>
            <Field label="Conta" hint="De onde sai o dinheiro">
              <TextSelect defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                <option>Conta corrente</option>
                <option>Poupança</option>
              </TextSelect>
            </Field>
            <Field label="Valor" error="Informe um valor maior que zero">
              <TextInput type="number" aria-invalid defaultValue={0} />
            </Field>
          </div>
        </Section>

        <Section title="Tabela">
          <DataTable
            headers={['Descrição', 'Categoria', { label: 'Valor', right: true }]}
          >
            <Tr onClick={() => undefined}>
              <Td>Mercado do mês</Td>
              <Td>
                <CategoryChip name="Mercado" colorIndex={1} />
              </Td>
              <Td right>
                <MoneyValue amount={432.1} direction="debit" />
              </Td>
            </Tr>
            <Tr onClick={() => undefined}>
              <Td>Salário</Td>
              <Td>
                <CategoryChip name="Salário" colorIndex={7} />
              </Td>
              <Td right>
                <MoneyValue amount={8200} direction="credit" />
              </Td>
            </Tr>
          </DataTable>
        </Section>

        <Section title="Feedback">
          <div className="flex flex-col gap-3">
            <Alert tone="info">Sincronizado há 2 minutos.</Alert>
            <Alert tone="warning" title="Orçamento estourado">
              Você passou do teto em Alimentação.
            </Alert>
            <Alert tone="danger">Não foi possível carregar as contas.</Alert>
            <LoadingBlock label="Carregando lançamentos…" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 grow" />
            </div>
            <EmptyState
              message="Nenhum lançamento neste mês."
              icon={Wallet}
              action={<Button size="sm" icon={Plus}>Novo lançamento</Button>}
            />
          </div>
        </Section>

        <Section title="Cartão e modal">
          <Card>
            <CardHeader
              title="Cartão de crédito"
              description="Fatura fecha dia 5"
              actions={<Button size="sm" variant="secondary">Ver faturas</Button>}
            />
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-fg-muted">Limite disponível</p>
                <p className="font-display text-xl font-bold tabular-nums">
                  R$ 3.870,00
                </p>
              </div>
              <Button icon={Plus} onClick={() => setModalOpen(true)}>
                Nova compra
              </Button>
            </div>
          </Card>
          {modalOpen ? (
            <Modal
              title="Nova compra no cartão"
              onClose={() => setModalOpen(false)}
              footer={
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={() => setModalOpen(false)}>Salvar</Button>
                </>
              }
            >
              <div className="grid gap-4">
                <Field label="Descrição">
                  <TextInput placeholder="Ex.: Supermercado" />
                </Field>
                <Field label="Valor">
                  <TextInput type="number" />
                </Field>
              </div>
            </Modal>
          ) : null}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
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
