<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreStatementImportRequest;
use App\Models\Account;
use App\Models\Context;
use App\UseCases\Transaction\ImportStatementFromCsv;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Importação de extrato bancário via planilha CSV — fallback manual do
 * capítulo 05.3 (D-06), disponível independente do Pluggy (F2) estar
 * ligado ou não. Ver {@see ImportStatementFromCsv} pra regra de
 * conversão/deduplicação/tolerância a erro por linha.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class StatementImportController extends Controller
{
    public function store(
        StoreStatementImportRequest $request,
        Context $context,
        Account $account,
        ImportStatementFromCsv $useCase,
    ): JsonResponse {
        return response()->json($useCase->execute($request->file('file'), $context->id, $account->id));
    }

    /** Planilha modelo pra preencher e enviar em `store()` — mesmo cabeçalho que o parser espera. */
    public function template(Context $context, Account $account): Response
    {
        $csv = "data,descricao,valor,categoria\n"
            ."10/09/2026,Supermercado ABC,-235.40,Mercado\n"
            ."12/09/2026,Recebimento cliente Y,1500.00,\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="modelo-importacao-extrato.csv"',
        ]);
    }
}
