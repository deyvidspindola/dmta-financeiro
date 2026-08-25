<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UnlockBillCaptureRequest;
use App\Http\Resources\PendingBillCaptureResource;
use App\Models\PendingBillCapture;
use App\UseCases\Bill\UnlockBillCapture;

/**
 * Desbloqueia uma captura `password_required` (DT-07). Separado de
 * {@see BillCaptureController} pelo limite de linhas do controller.
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
final class UnlockBillCaptureController extends Controller
{
    public function store(
        UnlockBillCaptureRequest $request,
        PendingBillCapture $capture,
        UnlockBillCapture $useCase,
    ): PendingBillCaptureResource {
        return new PendingBillCaptureResource(
            $useCase->execute($capture, $request->string('password')->toString()),
        );
    }
}
