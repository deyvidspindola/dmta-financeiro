/**
 * Single public surface for HTTP resources.
 * UI code imports from here — never hardcodes URLs or payload shapes.
 */
export * as authApi from './auth'
export * as contextsApi from './contexts'
export * as dashboardApi from './dashboard'
export * as accountsApi from './accounts'
export * as categoriesApi from './categories'
export * as billsApi from './bills'
export * as transactionsApi from './transactions'
export * as creditCardsApi from './creditCards'
export * as investmentsApi from './investments'
export { bindAuthToken, ApiError } from './http'
export { useMocks } from './config'
