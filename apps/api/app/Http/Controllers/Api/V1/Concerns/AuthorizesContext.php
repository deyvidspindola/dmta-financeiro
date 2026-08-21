<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Concerns;

use App\Models\Context;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Checagem de posse de contexto, reusada por todo controller de recurso
 * aninhado em `/contexts/{context}/...`. Isolamento de dado (capítulo 12
 * do documento de concepção) depende de nunca pular esta checagem.
 *
 * @package App\Http\Controllers\Api\V1\Concerns
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
trait AuthorizesContext
{
    /** @throws AuthorizationException Se o contexto não for do usuário autenticado. */
    private function assertOwnsContext(Context $context): void
    {
        $this->authorize('view', $context);
    }
}
