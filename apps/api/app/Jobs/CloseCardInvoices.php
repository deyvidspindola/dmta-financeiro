<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\CreditCard;
use App\UseCases\CreditCard\CloseCardInvoices as CloseCardInvoicesUseCase;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Fecha as faturas de cartão cuja data de fechamento já passou — roda uma
 * vez por dia via `schedule:run` (nunca processo permanente, ver skill
 * `padroes-laravel-dmta` seção 2). Idempotente; erro num cartão não trava
 * os outros. A lógica de "essa fatura já fechou?" está no caso de uso
 * {@see CloseCardInvoicesUseCase}.
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class CloseCardInvoices implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(CloseCardInvoicesUseCase $useCase): void
    {
        CreditCard::query()->each(function (CreditCard $card) use ($useCase): void {
            try {
                $useCase->execute($card);
            } catch (Throwable $e) {
                Log::error('Falha ao fechar faturas do cartão', [
                    'credit_card_id' => $card->id,
                    'error' => $e->getMessage(),
                ]);
            }
        });
    }
}
