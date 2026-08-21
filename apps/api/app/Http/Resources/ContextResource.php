<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Context;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de um {@see Context}.
 *
 * @mixin Context
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class ContextResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // @phpstan-ignore-next-line property.nonObject (cast ContextType da migration)
            'type' => $this->type->value,
            'name' => $this->name,
            'company' => $this->whenLoaded('company', fn () => [
                'id' => $this->company->id,
                'name' => $this->company->name,
                'document' => $this->company->document,
            ]),
        ];
    }
}
