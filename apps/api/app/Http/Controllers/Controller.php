<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * Controller base do projeto.
 *
 * Só dá aos controllers reais o `$this->authorize()` de Policy (ver
 * `AuthorizesRequests`) — não implementa nada de regra própria. Controller
 * nunca tem `if` de regra de negócio (ver CONVENTIONS.md): no máximo
 * delega a um UseCase e formata a resposta.
 *
 * @package App\Http\Controllers
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 21/08/2026
 */
abstract class Controller
{
    use AuthorizesRequests;
}
