import { http } from '@/api/http';
import { mapConsolidatedDashboard, mapDashboard, mapEvolutionSeries } from '@/api/mappers';
import type { DashboardSummary, EvolutionPoint } from '@/types/models';

type ApiDashboardSlice = {
  context_id?: string | number;
  accounts_balance: number;
  pending_bills_amount: number;
  overdue_bills_count: number;
  month_income: number;
  month_expense: number;
  month_projected_income?: number;
  month_projected_expense?: number;
  investments_total: number;
};

export async function getDashboard(
  scope: string | 'consolidated',
  month?: string,
): Promise<DashboardSummary> {
  const monthQuery = month ? `?month=${encodeURIComponent(month)}` : '';

  if (scope === 'consolidated') {
    const raw = await http.get<{ totals: ApiDashboardSlice }>(
      `/dashboard/consolidated${monthQuery}`,
    );
    return mapConsolidatedDashboard(raw);
  }

  const raw = await http.get<ApiDashboardSlice>(`/contexts/${scope}/dashboard${monthQuery}`);
  return mapDashboard(scope, scope, raw);
}

export async function getDashboardEvolution(
  scope: string | 'consolidated',
  months = 6,
): Promise<EvolutionPoint[]> {
  if (scope === 'consolidated') {
    const raw = await http.get<{ series: EvolutionPoint[] }>(
      `/dashboard/consolidated/evolution?months=${months}`,
    );
    return mapEvolutionSeries(raw);
  }

  const raw = await http.get<{ series: EvolutionPoint[] }>(
    `/contexts/${scope}/dashboard/evolution?months=${months}`,
  );
  return mapEvolutionSeries(raw);
}
