import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/AppLayout'
import { KitPage } from '@/pages/KitPage'
import { applyTheme, useThemeStore } from '@/store/themeStore'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { MorePage } from '@/pages/MorePage'
import { QuickAddPage } from '@/pages/QuickAddPage'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { CreditCardsPage } from '@/pages/CreditCardsPage'
import { BillsPage } from '@/pages/BillsPage'
import { BillCapturesPage } from '@/pages/BillCapturesPage'
import { BoletoPasswordRulesPage } from '@/pages/BoletoPasswordRulesPage'
import { TransactionDetailPage } from '@/pages/TransactionDetailPage'
import { AccountDetailPage } from '@/pages/AccountDetailPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { RecurringTransactionsPage } from '@/pages/RecurringTransactionsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { CompaniesPage } from '@/pages/CompaniesPage'
import { InvestmentsPage } from '@/pages/InvestmentsPage'
import { SecurityPage } from '@/pages/SecurityPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { SimulatorPage } from '@/pages/SimulatorPage'
import { DebtsPage } from '@/pages/DebtsPage'
import { ImportBillsPage } from '@/pages/ImportBillsPage'
import { ImportStatementPage } from '@/pages/ImportStatementPage'
import { ToastHost } from '@/components/ToastHost'
import { bindAuthToken } from '@/api'
import { useAuthStore } from '@/store/authStore'

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
            <Route path="bills" element={<BillsPage />} />
            <Route path="bill-captures" element={<BillCapturesPage />} />
            <Route path="boleto-passwords" element={<BoletoPasswordRulesPage />} />
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
      </BrowserRouter>
    </QueryClientProvider>
  )
}
