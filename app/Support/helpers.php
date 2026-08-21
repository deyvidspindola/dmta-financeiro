<?php

declare(strict_types=1);

/**
 * Helpers globais — só formatação pura, sem lógica de negócio, sem banco.
 *
 * Cada função tem no máximo 10 linhas (ver CONVENTIONS.md). Se precisar de
 * mais que isso ou de uma consulta ao banco, o lugar certo é um Service ou
 * um Domain, não este arquivo.
 */
if (! function_exists('money_brl')) {
    /**
     * Formata um valor em centavos como moeda brasileira (R$ 1.234,56).
     *
     * Exemplo de helper de formatação pura: não busca cotação, não
     * arredonda regra de negócio — só exibe o que já foi calculado.
     *
     * @param  int  $cents  Valor em centavos (ex.: 123456 = R$ 1.234,56).
     */
    function money_brl(int $cents): string
    {
        return 'R$ '.number_format($cents / 100, 2, ',', '.');
    }
}
