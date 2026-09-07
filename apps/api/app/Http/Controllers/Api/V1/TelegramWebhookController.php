<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\TelegramWebhookRecorder;
use App\UseCases\Capture\HandleTelegramMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Webhook do bot do Telegram (capítulo 6.4, `docs/03_INTERFACES_PLUGAVEIS.md`)
 * — rota pública (sem Sanctum: o Telegram não carrega token nosso),
 * protegida pelo header `secret_token` do `setWebhook`. Sempre responde
 * 200 — devolver erro faz o Telegram reencaminhar em loop.
 *
 * Cada chamada vira uma linha em {@see TelegramWebhookRecorder} pra tela
 * de integrações responder "mandei mensagem, deu certo?".
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   25/08/2026
 *
 * @updated 07/09/2026
 */
final class TelegramWebhookController extends Controller
{
    public function store(
        Request $request,
        HandleTelegramMessage $useCase,
        TelegramWebhookRecorder $recorder,
    ): JsonResponse {
        $secret = config('services.telegram.webhook_secret');
        $chatId = $request->input('message.chat.id');
        $text = $request->input('message.text');
        $chatId = $chatId !== null ? (string) $chatId : null;

        if ($secret && $request->header('X-Telegram-Bot-Api-Secret-Token') !== $secret) {
            $recorder->record($chatId, is_string($text) ? $text : null, 'secret_mismatch', 'o header não confere com o webhook_secret salvo');

            return response()->json(status: 401);
        }

        if ($chatId !== null && is_string($text)) {
            $useCase->execute($chatId, $text);
        } else {
            $recorder->record($chatId, null, 'ignored', 'update sem message.text (ex.: edição, foto, sticker)');
        }

        return response()->json(status: 200);
    }
}
