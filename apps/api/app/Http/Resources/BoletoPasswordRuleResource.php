<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\BoletoPasswordRule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see BoletoPasswordRule}. Nunca expõe uma
 * senha computada — só o que está cadastrado em `rule_params` (que já
 * não é a senha em si, ver DT-07).
 *
 * @mixin BoletoPasswordRule
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class BoletoPasswordRuleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sender_domain' => $this->sender_domain,
            // @phpstan-ignore-next-line property.nonObject (cast BoletoPasswordRuleType da migration)
            'rule_type' => $this->rule_type->value,
            'rule_params' => $this->rule_params,
            'label' => $this->label,
            // @phpstan-ignore-next-line method.nonObject (cast 'datetime' da migration)
            'last_used_at' => $this->last_used_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
