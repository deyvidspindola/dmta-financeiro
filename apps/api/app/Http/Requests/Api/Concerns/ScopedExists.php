<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\Concerns;

use App\Models\Context;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

/**
 * Regras `exists` amarradas ao contexto — a defesa contra vazamento entre
 * contextos do próprio usuário (lançar numa conta de outra empresa,
 * marcar boleto alheio como pago) no corpo de um FormRequest.
 *
 * O `scopeBindings()` das rotas só protege o `{model}` da URL, nunca os
 * ids que chegam no corpo. `exists:accounts,id` cru aceita qualquer
 * conta do banco; estas regras restringem ao `context_id` certo.
 *
 * NÃO substitui a autorização da rota (`can:view,context`) nem as
 * exceções de domínio dos casos de uso — é a primeira barreira, não a
 * única.
 *
 * @package App\Http\Requests\Api\Concerns
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   31/08/2026
 *
 * @updated 31/08/2026
 */
trait ScopedExists
{
    /**
     * `exists` restrito às linhas de `$table` cujo `context_id` é o
     * `{context}` da rota atual.
     *
     * @param  string  $table  Tabela com coluna `context_id`.
     */
    protected function existsInRouteContext(string $table): Exists
    {
        return Rule::exists($table, 'id')->where('context_id', $this->routeContext()->id);
    }

    /**
     * `exists` restrito a um contexto específico — use com um id de
     * contexto já validado como pertencente ao usuário
     * ({@see existsUserContext}).
     *
     * @param  string  $table  Tabela com coluna `context_id`.
     * @param  int|null  $contextId  Id do contexto; `null` faz a regra nunca casar.
     */
    protected function existsInContext(string $table, ?int $contextId): Exists
    {
        return Rule::exists($table, 'id')->where('context_id', $contextId ?? 0);
    }

    /** `exists` restrito aos contextos do próprio usuário autenticado. */
    protected function existsUserContext(): Exists
    {
        return Rule::exists('contexts', 'id')->where('user_id', $this->user()->id);
    }

    /** O `{context}` vinculado à rota atual. */
    protected function routeContext(): Context
    {
        $context = $this->route('context');

        abort_unless($context instanceof Context, 500, 'Rota sem {context} vinculado.');

        return $context;
    }
}
