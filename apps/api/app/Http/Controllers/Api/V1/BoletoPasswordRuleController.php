<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\BoletoPasswordRuleType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBoletoPasswordRuleRequest;
use App\Http\Resources\BoletoPasswordRuleResource;
use App\Models\BoletoPasswordRule;
use App\UseCases\Bill\RegisterBoletoPasswordRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Cadastro de regras de senha de boleto por remetente (DT-07) — cadastro
 * simples e editável (index/store/destroy), sem tela dedicada exigida:
 * a oferta de "salvar como regra" nasce do fluxo de desbloqueio manual
 * (`POST bill-captures/{capture}/unlock`), mas a regra em si é um recurso
 * à parte, sem contexto (PF/PJ), porque uma regra de senha de banco não é
 * dado financeiro.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class BoletoPasswordRuleController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return BoletoPasswordRuleResource::collection(
            BoletoPasswordRule::query()->orderBy('sender_domain')->get(),
        );
    }

    public function store(StoreBoletoPasswordRuleRequest $request, RegisterBoletoPasswordRule $useCase): BoletoPasswordRuleResource
    {
        $rule = $useCase->execute(
            $request->string('sender_domain')->toString(),
            BoletoPasswordRuleType::from($request->string('rule_type')->toString()),
            $request->array('rule_params'),
            $request->input('label'),
        );

        return new BoletoPasswordRuleResource($rule);
    }

    public function destroy(BoletoPasswordRule $boletoPasswordRule): JsonResponse
    {
        $boletoPasswordRule->delete();

        return response()->json(status: 204);
    }
}
