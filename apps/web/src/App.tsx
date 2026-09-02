import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/AppLayout'
import { RequireAuth } from '@/components/RequireAuth'
import { ToastHost } from '@/components/ToastHost'
import { LoadingBlock } from '@/components/ui'
import { applyTheme, useThemeStore } from '@/store/themeStore'
import { strings } from '@/i18n/pt-BR'
import { bindAuthToken } from '@/api'
import { useAuthStore } from '@/store/authStore'

// Cada rota é um chunk próprio — o bundle inicial carrega só o shell + a 1ª tela.
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const MorePage = lazy(() =>
  import('@/pages/MorePage').then((m) => ({ default: m.MorePage })),
)
const QuickAddPage = lazy(() =>
  import('@/pages/QuickAddPage').then((m) => ({ default: m.QuickAddPage })),
)
const BudgetsPage = lazy(() =>
  import('@/pages/BudgetsPage').then((m) => ({ default: m.BudgetsPage })),
)
const AccountsPage = lazy(() =>
  import('@/pages/AccountsPage').then((m) => ({ default: m.AccountsPage })),
)
const AccountDetailPage = lazy(() =>
  import('@/pages/AccountDetailPage').then((m) => ({
    default: m.AccountDetailPage,
  })),
)
const CreditCardsPage = lazy(() =>
  import('@/pages/CreditCardsPage').then((m) => ({ default: m.CreditCardsPage })),
)
const CreditCardDetailPage = lazy(() =>
  import('@/pages/CreditCardDetailPage').then((m) => ({
    default: m.CreditCardDetailPage,
  })),
)
const BillsPage = lazy(() =>
  import('@/pages/BillsPage').then((m) => ({ default: m.BillsPage })),
)
const BillCapturesPage = lazy(() =>
  import('@/pages/BillCapturesPage').then((m) => ({ default: m.BillCapturesPage })),
)
const BoletoPasswordRulesPage = lazy(() =>
  import('@/pages/BoletoPasswordRulesPage').then((m) => ({
    default: m.BoletoPasswordRulesPage,
  })),
)
const TransactionsPage = lazy(() =>
  import('@/pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })),
)
const TransactionDetailPage = lazy(() =>
  import('@/pages/TransactionDetailPage').then((m) => ({
    default: m.TransactionDetailPage,
  })),
)
const RecurringTransactionsPage = lazy(() =>
  import('@/pages/RecurringTransactionsPage').then((m) => ({
    default: m.RecurringTransactionsPage,
  })),
)
const CategoriesPage = lazy(() =>
  import('@/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
)
const CompaniesPage = lazy(() =>
  import('@/pages/CompaniesPage').then((m) => ({ default: m.CompaniesPage })),
)
const InvestmentsPage = lazy(() =>
  import('@/pages/InvestmentsPage').then((m) => ({ default: m.InvestmentsPage })),
)
const GoalsPage = lazy(() =>
  import('@/pages/GoalsPage').then((m) => ({ default: m.GoalsPage })),
)
const SimulatorPage = lazy(() =>
  import('@/pages/SimulatorPage').then((m) => ({ default: m.SimulatorPage })),
)
const DebtsPage = lazy(() =>
  import('@/pages/DebtsPage').then((m) => ({ default: m.DebtsPage })),
)
const ImportBillsPage = lazy(() =>
  import('@/pages/ImportBillsPage').then((m) => ({ default: m.ImportBillsPage })),
)
const ImportStatementPage = lazy(() =>
  import('@/pages/ImportStatementPage').then((m) => ({
    default: m.ImportStatementPage,
  })),
)
const SecurityPage = lazy(() =>
  import('@/pages/SecurityPage').then((m) => ({ default: m.SecurityPage })),
)
const KitPage = lazy(() =>
  import('@/pages/KitPage').then((m) => ({ default: m.KitPage })),
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

bindAuthToken(() => useAuthStore.getState().token)

/** Mantém o tema 'system' em sincronia quando o SO troca claro/escuro. */
function useSystemThemeSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => applyTheme(useThemeStore.getState().pref)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
}

export default function App() {
  useSystemThemeSync()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/app">
        <ToastHost />
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center bg-canvas">
              <LoadingBlock label={strings.common.loading} />
            </div>
          }
        >
          <Routes>
            {import.meta.env.DEV ? (
              <Route path="/kit" element={<KitPage />} />
            ) : null}
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="mais" element={<MorePage />} />
              <Route path="novo" element={<QuickAddPage />} />
              <Route path="budgets" element={<BudgetsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="accounts/:id" element={<AccountDetailPage />} />
              <Route path="credit-cards" element={<CreditCardsPage />} />
              <Route path="credit-cards/:id" element={<CreditCardDetailPage />} />
              <Route path="bills" element={<BillsPage />} />
              <Route path="bill-captures" element={<BillCapturesPage />} />
              <Route
                path="boleto-passwords"
                element={<BoletoPasswordRulesPage />}
              />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="transactions/:id" element={<TransactionDetailPage />} />
              <Route path="recurring" element={<RecurringTransactionsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="investments" element={<InvestmentsPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="simulator" element={<SimulatorPage />} />
              <Route path="debts" element={<DebtsPage />} />
              <Route path="import-bills" element={<ImportBillsPage />} />
              <Route path="import-statement" element={<ImportStatementPage />} />
              <Route path="security" element={<SecurityPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
