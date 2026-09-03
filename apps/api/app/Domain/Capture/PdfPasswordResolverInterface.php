<?php

declare(strict_types=1);

namespace App\Domain\Capture;

/**
 * Gera senhas candidatas pra abrir um PDF de boleto protegido, a partir
 * do remetente do e-mail — ver DT-07. Não garante acerto, só lista o que
 * deve ser tentado, na ordem de prioridade; quem chama tenta cada uma até
 * uma funcionar (ou desiste e vira `password_required`).
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 25/08/2026
 */
interface PdfPasswordResolverInterface
{
    /**
     * @param  ?string  $senderEmail  Remetente do boleto, se conhecido. `null` só usa regras globais (`sender_domain = *`).
     * @return list<string> Senhas candidatas, na ordem de prioridade (pode ser vazia).
     */
    public function resolveCandidates(?string $senderEmail): array;

    /**
     * Todas as candidatas de todas as regras, sem filtrar por remetente —
     * para quando não há e-mail de origem (ex.: fatura de cartão enviada
     * à mão).
     *
     * @return list<string>
     */
    public function resolveAllCandidates(): array;
}
