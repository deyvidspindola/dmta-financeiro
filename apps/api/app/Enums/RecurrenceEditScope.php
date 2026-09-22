<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Alcance de uma edição ou exclusão num lançamento/boleto que veio de
 * uma regra recorrente — pedido do dono (22/09/2026), mesmo padrão de
 * agenda (Google Calendar): "só este", "este e os futuros" ou "todos".
 * Sem efeito se o lançamento/boleto não vier de recorrência nenhuma.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/09/2026
 */
enum RecurrenceEditScope: string
{
    /** Só a ocorrência editada/apagada — o resto da série não muda. */
    case This = 'this';

    /**
     * Esta ocorrência e as futuras (`occurred_at`/`due_date` >= a desta).
     * Editar: atualiza a regra (o que ainda não existe nasce já com os
     * novos dados). Apagar: some com essas ocorrências e desativa a
     * regra — não gera mais nada depois daqui.
     */
    case Future = 'future';

    /** Toda a série, passado incluído — reescreve/apaga cada ocorrência já materializada e a regra em si. */
    case All = 'all';
}
