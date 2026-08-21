import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/AppLayout'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { CreditCardsPage } from '@/pages/CreditCardsPage'
import { BillsPage } from '@/pages/BillsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { InvestmentsPage } from '@/pages/InvestmentsPage'
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="credit-cards" element={<CreditCardsPage />} />
            <Route path="bills" element={<BillsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="investments" element={<InvestmentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
