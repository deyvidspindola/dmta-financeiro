<?php

declare(strict_types=1);

namespace App\UseCases\Settings;

use App\Models\IntegrationSettings;

/**
 * Salva a configuração das integrações da F1 (Telegram e caixa IMAP de
 * boletos) vinda da tela.
 *
 * Aplica só os campos presentes no payload — chave ausente fica como
 * está, chave com `null` limpa o valor. Os campos sensíveis são cifrados
 * pelo cast do model. Não registra o webhook nem testa conexão: isso é
 * responsabilidade de casos de uso próprios ({@see RegisterTelegramWebhook},
 * {@see TestTelegramConnection}, {@see TestBoletoMailboxConnection}).
 *
 * @package App\UseCases\Settings
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class UpdateIntegrationSettings
{
    /**
     * Persiste os campos informados.
     *
     * @param  array<string, mixed>  $attributes  Payload já validado pelo FormRequest.
     * @return IntegrationSettings A linha salva, recarregada.
     */
    public function execute(array $attributes): IntegrationSettings
    {
        IntegrationSettings::query()->firstOrCreate([])->update($attributes);

        // Instância limpa (sem `wasRecentlyCreated`) — a resposta do PUT é
        // sempre 200, nunca 201, mesmo na primeira gravação.
        $settings = IntegrationSettings::query()->firstOrFail();

        // Faz valer já nesta requisição (o overlay do boot só roda no
        // próximo request) — assim a resposta e um "testar conexão" logo
        // em seguida já enxergam o valor recém-salvo.
        config($settings->servicesConfigOverrides());

        return $settings;
    }
}
