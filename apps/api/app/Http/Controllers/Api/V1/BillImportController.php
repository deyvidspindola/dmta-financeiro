<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBillImportRequest;
use App\Models\Context;
use App\UseCases\Bill\ImportBillsFromCsv;
use App\UseCases\Bill\PreviewBillsFromCsv;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Importação em massa de boletos via CSV — preview + store seletivo.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   22/08/2026
 *
 * @updated 03/09/2026
 */
final class BillImportController extends Controller
{
    public function preview(
        StoreBillImportRequest $request,
        Context $context,
        PreviewBillsFromCsv $useCase,
    ): JsonResponse {
        return response()->json(
            $useCase->execute($request->file('file'), $context->id),
        );
    }

    public function store(
        StoreBillImportRequest $request,
        Context $context,
        ImportBillsFromCsv $useCase,
    ): JsonResponse {
        return response()->json($useCase->execute(
            $request->file('file'),
            $context->id,
            $request->onlyLines(),
        ));
    }

    /** Planilha modelo — mesmo cabeçalho que o parser espera. */
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
