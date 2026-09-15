<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\StatementEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de um {@see StatementEntry}.
 *
 * @mixin StatementEntry
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class StatementEntryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_id' => $this->account_id,
            'category_id' => $this->category_id,
            'bill_id' => $this->bill_id,
            'card_invoice_id' => $this->card_invoice_id,
            'goal_id' => $this->goal_id,
            'transfer_pair_id' => $this->transfer_pair_id,
            'recurring_transaction_id' => $this->recurring_transaction_id,
            'description' => $this->description,
            'notes' => $this->notes,
            'amount' => (float) $this->amount,
            // @phpstan-ignore-next-line property.nonObject (cast StatementEntryType da migration)
            'type' => $this->type->value,
            // @phpstan-ignore-next-line property.nonObject (cast StatementEntryStatus da migration)
            'status' => $this->status->value,
            // @phpstan-ignore-next-line method.nonObject (cast 'datetime' da migration; null enquanto previsto)
            'settled_at' => $this->settled_at?->toIso8601String(),
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'occurred_at' => $this->occurred_at->toDateString(),
            'origin' => $this->origin,
            // Só presente na visão consolidada — ver AccountResource.
            'context' => new ContextResource($this->whenLoaded('context')),
            // Só presente se for transferência E o controller eager-loadar
            // transferPair.account.context — nunca lazy-load aqui dentro
            // (evita N+1 silencioso em listagem).
            'transfer' => $this->when(
                $this->transfer_pair_id !== null && $this->relationLoaded('transferPair'),
                fn () => $this->transferDetails(),
            ),
        ];
    }

    /**
     * Monta "de onde saiu → pra onde foi" — cada lado com o contexto e a
     * conta, pra tela mostrar isso ao visualizar/editar um lançamento de
     * transferência, mesmo quando os dois lados são de contextos
     * diferentes (PF ⇄ empresa).
     *
     * @return array{from: array<string, mixed>, to: array<string, mixed>}
     */
    private function transferDetails(): array
    {
        /** @var StatementEntry $pair */
        $pair = $this->transferPair;
        /** @var StatementEntry $self */
        $self = $this->resource;

        [$origin, $destination] = $self->isTransferOrigin() ? [$self, $pair] : [$pair, $self];

        return [
            'from' => $this->legDetails($origin),
            'to' => $this->legDetails($destination),
        ];
    }

    /** @return array<string, mixed> */
    private function legDetails(StatementEntry $entry): array
    {
        return [
            'context' => new ContextResource($entry->account->context),
            'account' => ['id' => $entry->account->id, 'name' => $entry->account->name],
        ];
    }
}
