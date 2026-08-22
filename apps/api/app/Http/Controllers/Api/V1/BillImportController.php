<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBillImportRequest;
use App\Models\Context;
use App\UseCases\Bill\ImportBillsFromCsv;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Importação em massa de boletos via planilha CSV — pedido em produção
 * pra cadastrar vários de uma vez em vez de repetir o modal. Ver
 * {@see ImportBillsFromCsv} pra regra de conversão/tolerância a erro
 * por linha.
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
final class BillImportController extends Controller
{
    public function store(StoreBillImportRequest $request, Context $context, ImportBillsFromCsv $useCase): JsonResponse
    {
        return response()->json($useCase->execute($request->file('file'), $context->id));
    }

    /** Planilha modelo pra preencher e enviar em `store()` — mesmo cabeçalho que o parser espera. */
    public function template(Context $context): Response
    {
        $csv = "descricao,valor,vencimento,tipo,categoria,beneficiario,codigo_barras\n"
            ."Conta de luz,150.90,10/09/2026,pagar,Utilidades,Enel,\n"
            ."Mensalidade cliente X,1200.00,05/09/2026,receber,Serviços,,\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="modelo-importacao-boletos.csv"',
        ]);
    }
}
