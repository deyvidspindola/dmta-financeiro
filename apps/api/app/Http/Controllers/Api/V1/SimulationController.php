<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\SimulateInstallmentPurchaseData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SimulateInstallmentPurchaseRequest;
use App\Models\Context;
use App\UseCases\Simulation\SimulateInstallmentPurchase;
use Illuminate\Http\JsonResponse;

/**
 * Simulador de novo compromisso (capítulo 09, D-04). Só leitura — ver
 * docblock de {@see SimulateInstallmentPurchase}.
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
final class SimulationController extends Controller
{
    public function installmentPurchase(
        SimulateInstallmentPurchaseRequest $request,
        Context $context,
        SimulateInstallmentPurchase $useCase,
    ): JsonResponse {
        $result = $useCase->execute($context, new SimulateInstallmentPurchaseData(
            amount: (float) $request->input('amount'),
            installments: $request->integer('installments'),
            cashPrice: $request->has('cash_price') ? (float) $request->input('cash_price') : null,
        ));

        return response()->json($result);
    }
}
