<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreStatementImportRequest;
use App\Models\Account;
use App\Models\Context;
use App\UseCases\Transaction\ImportStatement;
use App\UseCases\Transaction\PreviewStatement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Importação de extrato bancário (CSV ou PDF) — preview + store seletivo.
 * PDF protegido é decifrado com as senhas de boleto cadastradas ou a que
 * o usuário informa (`password`); cada banco tem seu próprio motor de
 * leitura (`App\Services\StatementParsers`).
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   22/08/2026
 *
 * @updated 16/09/2026
 */
final class StatementImportController extends Controller
{
    public function preview(
        StoreStatementImportRequest $request,
        Context $context,
        Account $account,
        PreviewStatement $useCase,
    ): JsonResponse {
        return response()->json($useCase->execute(
            $request->file('file'),
            $context->id,
            $account->id,
            $request->input('password'),
        ));
    }

    public function store(
        StoreStatementImportRequest $request,
        Context $context,
        Account $account,
        ImportStatement $useCase,
    ): JsonResponse {
        return response()->json($useCase->execute(
            $request->file('file'),
            $context->id,
            $account->id,
            $request->onlyLines(),
            $request->input('password'),
        ));
    }

    /** Planilha modelo — mesmo cabeçalho que o parser espera. */
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
