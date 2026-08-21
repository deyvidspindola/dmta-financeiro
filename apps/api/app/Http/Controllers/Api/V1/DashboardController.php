<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesContext;
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
    use AuthorizesContext;

    public function show(Context $context, DashboardSummaryService $service): JsonResponse
    {
        $this->assertOwnsContext($context);

        return response()->json($service->forContext($context));
    }

    public function consolidated(Request $request, DashboardSummaryService $service): JsonResponse
    {
        return response()->json($service->consolidated($request->user()));
    }
}
