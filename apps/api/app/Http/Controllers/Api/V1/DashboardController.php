<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Context;
use App\Services\DashboardEvolutionService;
use App\Services\DashboardSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Dashboard por contexto e dashboard consolidado (capítulo 04.3, F0).
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 02/09/2026
 */
final class DashboardController extends Controller
{
    /** `?month=YYYY-MM` (padrão: mês atual) rege `month_income`/`month_expense`. */
    public function show(Request $request, Context $context, DashboardSummaryService $service): JsonResponse
    {
        return response()->json($service->forContext($context, $this->referenceMonth($request)));
    }

    public function consolidated(Request $request, DashboardSummaryService $service): JsonResponse
    {
        return response()->json($service->consolidated($request->user(), $this->referenceMonth($request)));
    }

    /** Mês de `?month=YYYY-MM`, ou `null` quando ausente/vazio (o serviço assume o mês atual). */
    private function referenceMonth(Request $request): ?Carbon
    {
        return $request->filled('month')
            ? Carbon::parse($request->string('month')->toString())->startOfMonth()
            : null;
    }

    /** Série mensal (receita/despesa/saldo) de um contexto — `?months=` entre 1 e 24, padrão 6. */
    public function evolution(Request $request, Context $context, DashboardEvolutionService $service): JsonResponse
    {
        return response()->json([
            'series' => $service->forContext($context, $request->integer('months') ?: null),
        ]);
    }

    /** Mesma série, consolidada entre todos os contextos do usuário. */
    public function consolidatedEvolution(Request $request, DashboardEvolutionService $service): JsonResponse
    {
        return response()->json([
            'series' => $service->forConsolidated($request->user(), $request->integer('months') ?: null),
        ]);
    }
}
