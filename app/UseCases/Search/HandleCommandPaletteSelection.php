<?php

declare(strict_types=1);

namespace App\UseCases\Search;

use TallStackUi\Support\CommandPalette\Callback;
use TallStackUi\Support\CommandPalette\ItemSelected;

/**
 * Trata a seleção de um item no command palette (Ctrl+K).
 *
 * Registrado em `config/tallstackui.php` (chave `command-palette.actionable`)
 * — o TallStackUI invoca esta classe direto, sem passar pelo Controller de
 * busca. `__invoke` (não `execute`) é exigido pelo pacote, não é escolha
 * deste projeto.
 *
 * {@see SearchGlobally} já devolve a URL de destino pronta no campo
 * `value` de cada resultado — esta classe só redireciona pra lá, então
 * funciona pra qualquer tipo de entidade que a busca vier a incluir no
 * futuro, sem precisar saber o que foi selecionado.
 *
 * @package App\UseCases\Search
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
final class HandleCommandPaletteSelection
{
    public function __invoke(ItemSelected $selected): Callback
    {
        return Callback::redirect((string) $selected->value)->navigate();
    }
}
