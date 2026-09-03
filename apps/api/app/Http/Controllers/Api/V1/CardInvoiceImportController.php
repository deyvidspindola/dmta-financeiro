<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCardInvoiceImportRequest;
use App\Models\Context;
use App\Models\CreditCard;
use App\UseCases\CreditCard\ImportCardInvoice;
use App\UseCases\CreditCard\PreviewCardInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Importação de fatura de cartão (CSV ou PDF) — preview + store seletivo.
 * PDF protegido é decifrado com as senhas de boleto cadastradas ou a que
 * o usuário informa (`password`).
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class CardInvoiceImportController extends Controller
{
    public function preview(
        StoreCardInvoiceImportRequest $request,
        Context $context,
        CreditCard $creditCard,
        PreviewCardInvoice $useCase,
    ): JsonResponse {
        return response()->json($useCase->execute(
            $request->file('file'),
            $context->id,
            $creditCard->id,
            $request->input('password'),
        ));
    }

    public function store(
        StoreCardInvoiceImportRequest $request,
        Context $context,
        CreditCard $creditCard,
        ImportCardInvoice $useCase,
    ): JsonResponse {
        return response()->json($useCase->execute(
            $request->file('file'),
            $context->id,
            $creditCard->id,
            $request->onlyLines(),
            $request->input('password'),
        ));
    }

    /** Planilha modelo — mesmo cabeçalho que o parser espera. */
    public function template(Context $context, CreditCard $creditCard): Response
    {
        $csv = "data,descricao,valor,categoria,parcela\n"
            ."05/09/2026,Supermercado,189.90,Mercado,\n"
            ."08/09/2026,Notebook loja X,499.90,Eletrônicos,2/6\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="modelo-importacao-fatura-cartao.csv"',
        ]);
    }
}
