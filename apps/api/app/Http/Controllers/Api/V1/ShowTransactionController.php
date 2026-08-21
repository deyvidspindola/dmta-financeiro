<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StatementEntryResource;
use App\Models\Context;
use App\Models\StatementEntry;

/**
 * Visualizar um lançamento — separado de {@see TransactionController} só
 * pra não estourar o limite de linhas do controller (CONVENTIONS.md).
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class ShowTransactionController extends Controller
{
    /** `transferPair` eager-load é pro "de onde → pra onde" — ver StatementEntryResource::transferDetails(). */
    public function show(Context $context, StatementEntry $transaction): StatementEntryResource
    {
        $transaction->loadMissing('transferPair.account.context');

        return new StatementEntryResource($transaction);
    }
}
