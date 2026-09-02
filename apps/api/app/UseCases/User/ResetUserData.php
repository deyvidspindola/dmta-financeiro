<?php

declare(strict_types=1);

namespace App\UseCases\User;

use App\DTOs\CreateContextData;
use App\Enums\ContextType;
use App\Models\Account;
use App\Models\Bill;
use App\Models\Budget;
use App\Models\CardPurchase;
use App\Models\Category;
use App\Models\Company;
use App\Models\Context;
use App\Models\CreditCard;
use App\Models\Debt;
use App\Models\Goal;
use App\Models\Investment;
use App\Models\RecurringBill;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\Models\User;
use App\UseCases\Context\CreateContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Apaga todo o dado financeiro do usuário e recria um contexto PF limpo —
 * o "começar do zero" da tela de segurança.
 *
 * Apaga explicitamente cada tabela de domínio escopada por `context_id`
 * ({@see CONTEXT_SCOPED_MODELS}) e só então os próprios contextos, mais as
 * empresas que só existiam para esses contextos. As tabelas netas
 * (faturas de cartão, aportes de investimento) descem pelo `ON DELETE
 * CASCADE` das suas mães. Preserva a conta de acesso: {@see User}, senha,
 * MFA e tokens Sanctum não são tocados — o usuário continua logado.
 *
 * Não apaga a fila de captura por e-mail (`pending_bill_captures`) nem as
 * regras de senha de boleto: não são escopadas por usuário.
 *
 * @package App\UseCases\User
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   01/09/2026
 *
 * @updated 02/09/2026
 */
final class ResetUserData
{
    /**
     * Tabelas escopadas por contexto, apagadas antes dos próprios
     * contextos. Só o `ON DELETE CASCADE` de `contexts` não basta: no
     * MySQL/InnoDB, o `SET NULL` que o cascade dispara numa FK
     * auto-referente (`categories.parent_id`,
     * `statement_entries.transfer_pair_id`) ou entre linhas irmãs revalida
     * a FK `context_id` da linha — e o contexto já foi apagado no mesmo
     * cascade, o que estoura `SQLSTATE[23000] 1452` (issue FINANCEIRO-C).
     * Apagar cada tabela enquanto o contexto existe faz a revalidação
     * achar o pai; a ordem entre elas é indiferente (toda FK aqui é
     * `CASCADE` ou `SET NULL`). SQLite (testes) não tem esse comportamento.
     *
     * @var list<class-string<Model>>
     */
    private const CONTEXT_SCOPED_MODELS = [
        StatementEntry::class,
        Debt::class,
        Bill::class,
        RecurringBill::class,
        RecurringTransaction::class,
        Budget::class,
        Goal::class,
        CardPurchase::class,
        CreditCard::class,
        Category::class,
        Investment::class,
        Account::class,
    ];

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
            $contextIds = $user->contexts()->pluck('id')->all();

            $companyIds = $user->contexts()
                ->whereNotNull('company_id')
                ->pluck('company_id')
                ->all();

            foreach (self::CONTEXT_SCOPED_MODELS as $model) {
                $model::query()->whereIn('context_id', $contextIds)->delete();
            }

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
