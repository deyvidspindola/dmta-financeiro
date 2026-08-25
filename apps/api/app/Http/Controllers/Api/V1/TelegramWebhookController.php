<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\UseCases\Capture\HandleTelegramMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Webhook do bot do Telegram (capítulo 6.4, `docs/03_INTERFACES_PLUGAVEIS.md`)
 * — rota pública (sem Sanctum: o Telegram não tem como carregar um
 * token nosso), protegida pelo header `secret_token` configurado no
 * `setWebhook` (quando `TELEGRAM_WEBHOOK_SECRET` estiver definido).
 * Sempre responde 200 — devolver erro faz o Telegram reencaminhar a
 * mesma mensagem em loop.
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
final class TelegramWebhookController extends Controller
{
    public function store(Request $request, HandleTelegramMessage $useCase): JsonResponse
    {
        $secret = config('services.telegram.webhook_secret');

        if ($secret && $request->header('X-Telegram-Bot-Api-Secret-Token') !== $secret) {
            return response()->json(status: 401);
        }

        $chatId = $request->input('message.chat.id');
        $text = $request->input('message.text');

        if ($chatId !== null && is_string($text)) {
            $useCase->execute((string) $chatId, $text);
        }

        return response()->json(status: 200);
    }
}
