<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Context;
use App\Services\CashFlowProjector;
use Illuminate\Http\JsonResponse;

/**
 * Fluxo de caixa futuro (capítulo 9.3, D-04) — ver docblock de
 * {@see CashFlowProjector}.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class CashFlowController extends Controller
{
    public function show(Context $context, CashFlowProjector $projector): JsonResponse
    {
        return response()->json(['horizons' => $projector->project($context)]);
    }
}
