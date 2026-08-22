<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Context;
use App\Services\DashboardSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Dashboard por contexto e dashboard consolidado (capítulo 04.3, F0).
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class DashboardController extends Controller
{
    public function show(Context $context, DashboardSummaryService $service): JsonResponse
    {
        return response()->json($service->forContext($context));
    }

    public function consolidated(Request $request, DashboardSummaryService $service): JsonResponse
    {
        return response()->json($service->consolidated($request->user()));
    }

    /** Série mensal (receita/despesa/saldo) de um contexto — `?months=` entre 1 e 24, padrão 6. */
    public function evolution(Request $request, Context $context, DashboardSummaryService $service): JsonResponse
    {
        return response()->json([
            'series' => $service->evolutionForContext($context, $request->integer('months') ?: null),
        ]);
    }

    /** Mesma série, consolidada entre todos os contextos do usuário. */
    public function consolidatedEvolution(Request $request, DashboardSummaryService $service): JsonResponse
    {
        return response()->json([
            'series' => $service->evolutionConsolidated($request->user(), $request->integer('months') ?: null),
        ]);
    }
}
