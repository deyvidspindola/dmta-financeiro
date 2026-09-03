<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StatementEntryType;
use App\UseCases\Notification\IngestNotificationCaptures;

/**
 * Palpite de "que lançamento é esse" a partir do texto de uma
 * notificação de app de banco/carteira (Nubank, Inter, C6, Itaú, PicPay,
 * Mercado Pago...). É best-effort: extrai valor, tipo (entrada/saída) e
 * um nome curto quando dá. O usuário confirma/corrige na tela de inbox
 * ({@see IngestNotificationCaptures} guarda o palpite junto da captura).
 *
 * Conversão/heurística de formato, sem decisão de negócio — por isso é
 * Service e não UseCase.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class BankNotificationParser
{
    /** Palavras que indicam dinheiro entrando. */
    private const INCOME_HINTS = [
        'recebido', 'recebeu', 'você recebeu', 'entrada', 'crédito', 'creditado',
        'depósito', 'deposito', 'transferência recebida', 'pix recebido', 'salário',
        'estorno', 'reembolso', 'cashback',
    ];

    /** Palavras que indicam dinheiro saindo. */
    private const EXPENSE_HINTS = [
        'compra aprovada', 'compra de', 'pagamento', 'pagou', 'débito', 'debito',
        'debitado', 'saída', 'saida', 'pix enviado', 'transferência enviada',
        'transferência realizada', 'boleto pago', 'fatura', 'assinatura', 'cobrança',
    ];

    /** @return array{type: ?string, amount: ?float, description: ?string} */
    public function parse(string $title, string $body): array
    {
        $haystack = mb_strtolower(trim($title.' '.$body));

        return [
            'type' => $this->guessType($haystack)?->value,
            'amount' => $this->guessAmount($body),
            'description' => $this->guessDescription($title, $body),
        ];
    }

    private function guessType(string $haystack): ?StatementEntryType
    {
        foreach (self::EXPENSE_HINTS as $hint) {
            if (str_contains($haystack, $hint)) {
                return StatementEntryType::Expense;
            }
        }

        foreach (self::INCOME_HINTS as $hint) {
            if (str_contains($haystack, $hint)) {
                return StatementEntryType::Income;
            }
        }

        return null;
    }

    private function guessAmount(string $body): ?float
    {
        // R$ 1.234,56 | R$ 1234,56 | R$ 12.34 | R$1.234
        if (preg_match('/R\$\s*([\d.]+(?:,\d{2})?)/u', $body, $m) !== 1) {
            return null;
        }

        $raw = $m[1];

        if (str_contains($raw, ',')) {
            $raw = str_replace('.', '', $raw);
            $raw = str_replace(',', '.', $raw);
        }

        $value = (float) $raw;

        return $value > 0 ? round($value, 2) : null;
    }

    private function guessDescription(string $title, string $body): ?string
    {
        // "... em PADARIA X" / "... para FULANO" / "... de FULANO" / "... no ESTABELECIMENTO"
        if (preg_match('/\b(?:em|para|de|no|na)\s+([\p{L}\p{N} .&\'-]{3,60})/u', $body, $m) === 1) {
            $candidate = trim($m[1], ' .-');
            if ($candidate !== '' && ! is_numeric($candidate)) {
                return $this->tidy($candidate);
            }
        }

        $title = trim($title);
        if ($title !== '' && ! preg_match('/^(compra aprovada|pagamento|pix|notificação)$/iu', $title)) {
            return $this->tidy($title);
        }

        return null;
    }

    private function tidy(string $value): string
    {
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return mb_substr($value, 0, 120);
    }
}
