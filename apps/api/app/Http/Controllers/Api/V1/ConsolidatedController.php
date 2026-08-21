<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountResource;
use App\Http\Resources\BillResource;
use App\Http\Resources\StatementEntryResource;
use App\Models\Account;
use App\Models\Bill;
use App\Models\StatementEntry;
use App\Services\DashboardSummaryService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Listagens consolidadas entre todos os contextos do usuário — reusa os
 * mesmos Resources das rotas aninhadas em `/contexts/{context}/...`, só
 * que aqui `context` vem sempre preenchido (`with('context')`), pra tela
 * mostrar de onde é cada registro. Nunca usado pra decidir de onde um
 * lançamento sai/entra — só pra exibir tudo junto (capítulo 04.3, mesmo
 * princípio do {@see DashboardSummaryService}).
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
final class ConsolidatedController extends Controller
{
    public function accounts(Request $request): AnonymousResourceCollection
    {
        $contextIds = $request->user()->contexts()->pluck('id');
        $accounts = Account::query()->with('context')->whereIn('context_id', $contextIds)->get();

        return AccountResource::collection($accounts);
    }

    public function transactions(Request $request): AnonymousResourceCollection
    {
        $contextIds = $request->user()->contexts()->pluck('id');
        $entries = StatementEntry::query()->with(['context', 'transferPair.account.context'])
            ->whereIn('context_id', $contextIds)
            ->latest('occurred_at')
            ->get();

        return StatementEntryResource::collection($entries);
    }

    public function bills(Request $request): AnonymousResourceCollection
    {
        $contextIds = $request->user()->contexts()->pluck('id');
        $bills = Bill::query()->with('context')->whereIn('context_id', $contextIds)->get();

        return BillResource::collection($bills);
    }
}
