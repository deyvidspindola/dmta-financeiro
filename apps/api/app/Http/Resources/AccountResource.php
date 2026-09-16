<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Account;
use App\Services\DashboardSummaryService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de um {@see Account}.
 *
 * @mixin Account
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 16/09/2026
 */
final class AccountResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // @phpstan-ignore-next-line property.nonObject (cast AccountType da migration)
            'type' => $this->type->value,
            'institution' => $this->institution,
            'initial_balance' => (float) $this->initial_balance,
            'balance' => (float) $this->balance,
            'projected_balance' => $this->projectedBalance(),
            'include_in_dashboard' => (bool) $this->include_in_dashboard,
            'color' => $this->color,
            // Só presente quando o controller carrega a relação (visão
            // consolidada) — não repete o próprio contexto em toda linha
            // das listagens aninhadas normais, que já sabem qual é.
            'context' => new ContextResource($this->whenLoaded('context')),
        ];
    }

    /**
     * Saldo + o que ainda vai cair nesta conta (lançamento `pending`,
     * receita soma/despesa subtrai) — mesmo princípio do
     * `accounts_balance_provisioned` do {@see DashboardSummaryService},
     * só que por conta. `pending_income_sum`/`pending_expense_sum` só
     * existem quando o controller usa `withSum` (`AccountController::index`);
     * ausentes (mês passado, ou chamada avulsa em `show`), cai no próprio
     * saldo — histórico não tem "previsto".
     */
    private function projectedBalance(): float
    {
        $income = (float) ($this->pending_income_sum ?? 0);
        $expense = (float) ($this->pending_expense_sum ?? 0);

        return round((float) $this->balance + $income - $expense, 2);
    }
}
