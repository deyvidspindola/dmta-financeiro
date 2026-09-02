<?php

declare(strict_types=1);

namespace App\UseCases\User;

use App\DTOs\CreateContextData;
use App\Enums\ContextType;
use App\Models\Company;
use App\Models\Context;
use App\Models\User;
use App\UseCases\Context\CreateContext;
use Illuminate\Support\Facades\DB;

/**
 * Apaga todo o dado financeiro do usuário e recria um contexto PF limpo —
 * o "começar do zero" da tela de segurança.
 *
 * Remove os contextos do usuário (o `ON DELETE CASCADE` de cada tabela
 * de domínio leva junto contas, categorias, lançamentos, boletos,
 * orçamentos, metas, dívidas, cartões/faturas/compras, investimentos e
 * regras de recorrência) e as empresas que só existiam para esses
 * contextos. Preserva a conta de acesso: {@see User}, senha, MFA e
 * tokens Sanctum não são tocados — o usuário continua logado.
 *
 * Não apaga a fila de captura por e-mail (`pending_bill_captures`) nem as
 * regras de senha de boleto: não são escopadas por usuário.
 *
 * @package App\UseCases\User
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class ResetUserData
{
    public function __construct(private readonly CreateContext $createContext) {}

    /**
     * Executa o reset e devolve o novo contexto PF "Pessoal".
     *
     * @param  User  $user  Dono dos dados a apagar.
     * @return Context Contexto PF recém-criado, vazio.
     */
    public function execute(User $user): Context
    {
        return DB::transaction(function () use ($user): Context {
            $companyIds = $user->contexts()
                ->whereNotNull('company_id')
                ->pluck('company_id')
                ->all();

            $user->contexts()->delete();

            if ($companyIds !== []) {
                Company::query()->whereIn('id', $companyIds)->delete();
            }

            return $this->createContext->execute(new CreateContextData(
                userId: $user->id,
                type: ContextType::Pf,
                name: 'Pessoal',
            ));
        });
    }
}
