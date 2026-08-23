<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\UseCases\Bill\PollBoletoMailboxNow;
use Illuminate\Http\JsonResponse;

/**
 * Botão "capturar agora" da tela de Capturas — dispara
 * {@see PollBoletoMailboxNow} na hora, sem esperar o próximo ciclo do
 * agendador. Separado de {@see BillCaptureController} pelo mesmo motivo
 * de {@see PayBillController}: ação própria, controller principal já
 * no limite de linhas.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class PollBillCapturesController extends Controller
{
    public function store(PollBoletoMailboxNow $useCase): JsonResponse
    {
        return response()->json($useCase->execute());
    }
}
