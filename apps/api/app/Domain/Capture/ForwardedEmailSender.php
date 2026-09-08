<?php

declare(strict_types=1);

namespace App\Domain\Capture;

use Illuminate\Support\Str;
use Webklex\PHPIMAP\Message;

/**
 * Descobre o remetente **original** de um boleto que chegou reencaminhado
 * na caixa `boletos@...`. Quando o dono encaminha o e-mail do banco/da
 * concessionária, o `From` do envelope passa a ser o dele — e as regras
 * de senha (que casam por domínio do remetente, DT-07) nunca batem. Aqui
 * lemos o bloco "mensagem encaminhada" do corpo pra recuperar quem
 * mandou de verdade.
 *
 * Só olha corpo/assunto/remetente já extraídos — não conhece IMAP nem
 * {@see Message}. Não valida se o e-mail existe, não
 * escolhe senha, não decide se o canal está ligado.
 *
 * @package App\Domain\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   08/09/2026
 *
 * @updated 08/09/2026
 */
final class ForwardedEmailSender
{
    /** Marcadores que abrem o cabeçalho da mensagem encaminhada (pt/en/es, Gmail/Outlook/Apple Mail). */
    private const FORWARD_MARKERS = [
        'forwarded message',
        'begin forwarded message',
        'mensagem encaminhada',
        'mensagem reencaminhada',
        'início da mensagem reencaminhada',
        'inicio da mensagem reencaminhada',
        'mensaje reenviado',
        '-----mensagem original-----',
        '-----original message-----',
    ];

    /** Prefixos de assunto que denunciam um encaminhamento. */
    private const SUBJECT_PREFIXES = ['fwd:', 'fw:', 'enc:', 'encaminhada:', 'rv:', 'wg:', 'tr:'];

    /** Rótulos de "De:" em pt/en/es/de/it, no cabeçalho citado. */
    private const FROM_LABELS = 'From|De|Von|Da';

    /**
     * @param  string|null  $envelopeFrom  Quem entregou o e-mail na caixa (`From` do envelope).
     * @param  string|null  $subject  Assunto do e-mail.
     * @param  string|null  $body  Corpo em texto (plain de preferência; HTML é tolerado via strip_tags).
     * @param  list<string>  $forwarders  E-mails conhecidos que só reencaminham (opcional — reforça a detecção).
     * @return string|null E-mail do remetente original em minúsculas, ou `null` se o e-mail não parece reencaminhado.
     */
    public function original(?string $envelopeFrom, ?string $subject, ?string $body, array $forwarders = []): ?string
    {
        $from = $this->normalize($envelopeFrom);
        $text = $this->asText($body);

        if (! $this->looksForwarded($from, $subject, $text, $forwarders)) {
            return null;
        }

        return $this->firstQuotedSender($text, $from);
    }

    private function looksForwarded(?string $from, ?string $subject, string $text, array $forwarders): bool
    {
        if ($from !== null && in_array($from, array_map(fn (string $f): string => strtolower(trim($f)), $forwarders), true)) {
            return true;
        }

        $subjectLower = Str::lower(trim((string) $subject));

        foreach (self::SUBJECT_PREFIXES as $prefix) {
            if (str_starts_with($subjectLower, $prefix)) {
                return true;
            }
        }

        return $this->markerPosition($text) !== null;
    }

    /** Primeiro e-mail num "De:/From:" citado — depois do marcador de encaminhamento, se houver. */
    private function firstQuotedSender(string $text, ?string $from): ?string
    {
        $marker = $this->markerPosition($text);
        $haystack = $marker !== null ? substr($text, $marker) : $text;

        // Dois formatos de linha citada: `De: Nome <email>` (com nome) e
        // `De: email` (só o endereço, terminando a linha). O nome NÃO pode
        // vazar pra dentro do e-mail — daí o `<` obrigatório no 1º braço e
        // o fim de linha no 2º.
        $email = '([a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,})';
        $pattern = '/(?:^|\n)[>\s|]*(?:'.self::FROM_LABELS.')\s*:\s*'
            ."(?:[^\n<]*<\s*{$email}\s*>|{$email}\s*(?:\r?\n|$))/i";

        if (preg_match_all($pattern, $haystack, $matches, PREG_SET_ORDER) === false) {
            return null;
        }

        foreach ($matches as $match) {
            $email = strtolower(trim(($match[1] ?? '') !== '' ? $match[1] : ($match[2] ?? '')));

            if ($email !== '' && $email !== $from) {
                return $email;
            }
        }

        return null;
    }

    /** @return int|null Offset do primeiro marcador de encaminhamento no texto. */
    private function markerPosition(string $text): ?int
    {
        $lower = Str::lower($text);
        $best = null;

        foreach (self::FORWARD_MARKERS as $marker) {
            $pos = strpos($lower, $marker);

            if ($pos !== false && ($best === null || $pos < $best)) {
                $best = $pos;
            }
        }

        return $best;
    }

    /** Corpo HTML → texto: quebra em `<br>`/`</p>`/`</div>`, tira tags, decodifica entidades. */
    private function asText(?string $body): string
    {
        $body = (string) $body;

        if ($body === '' || preg_match('/<(?:div|p|br|span|table|td|tr|body|html|a|b|strong|blockquote|font|o:p)\b/i', $body) !== 1) {
            return $body;
        }

        $body = str_ireplace(['<br>', '<br/>', '<br />', '</p>', '</div>', '</tr>', '</blockquote>'], "\n", $body);

        return html_entity_decode(strip_tags($body), ENT_QUOTES | ENT_HTML5);
    }

    private function normalize(?string $email): ?string
    {
        $email = strtolower(trim((string) $email));

        return $email === '' ? null : $email;
    }
}
