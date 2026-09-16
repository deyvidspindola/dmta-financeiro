<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\DTOs\CreateCategoryData;
use App\DTOs\CreateContextData;
use App\DTOs\RegisterAccountData;
use App\DTOs\RegisterTransactionData;
use App\Enums\CategoryType;
use App\Enums\ContextType;
use App\Enums\StatementEntryType;
use App\Models\Company;
use App\Models\User;
use App\UseCases\Account\RegisterAccount;
use App\UseCases\Category\CreateCategory;
use App\UseCases\Context\CreateContext;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Seeder padrão do template — cria o usuário admin de desenvolvimento e,
 * a partir da F0, um contexto PF de exemplo com dado mínimo para as telas
 * não nascerem vazias no primeiro login (conta, categorias, um lançamento).
 *
 * A senha `password` e o e-mail `admin@example.com` são fixos de propósito,
 * só para ambiente local (Docker/CI). NUNCA rode este seeder em produção —
 * troque a senha imediatamente se isso acontecer por engano.
 *
 * @package Database\Seeders
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 21/08/2026
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Cria o usuário admin de teste local e um contexto PF de exemplo.
     *
     * Idempotente: não duplica o contexto PF se o seeder rodar de novo
     * sobre um banco que já tem dado (`CreateContext` bloquearia um
     * segundo PF para o mesmo usuário).
     */
    public function run(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrador',
                // Senha fixa apenas para desenvolvimento local — nunca em produção.
                'password' => 'password',
                'email_verified_at' => now(),
            ],
        );

        if ($user->contexts()->where('type', ContextType::Pf->value)->exists()) {
            return;
        }

        $this->seedDemoPfContext($user);
        $this->seedDemoCompanyContext($user);
    }

    /** Contexto PF, uma conta, duas categorias e um lançamento — só para não abrir tela vazia. */
    private function seedDemoPfContext(User $user): void
    {
        $context = app(CreateContext::class)->execute(new CreateContextData(
            userId: $user->id,
            type: ContextType::Pf,
            name: 'Pessoal',
        ));

        $account = app(RegisterAccount::class)->execute(new RegisterAccountData(
            contextId: $context->id,
            name: 'Conta corrente',
            institution: 'Banco de teste',
            initialBalance: 1000.0,
        ));

        $category = app(CreateCategory::class)->execute(new CreateCategoryData(
            contextId: $context->id,
            name: 'Alimentação',
            type: CategoryType::Expense,
        ));
        app(CreateCategory::class)->execute(new CreateCategoryData(
            contextId: $context->id,
            name: 'Moradia',
            type: CategoryType::Expense,
        ));
        app(CreateCategory::class)->execute(new CreateCategoryData(
            contextId: $context->id,
            name: 'Salário',
            type: CategoryType::Income,
        ));

        app(RegisterTransaction::class)->execute(new RegisterTransactionData(
            contextId: $context->id,
            accountId: $account->id,
            description: 'Supermercado',
            amount: 150.0,
            type: StatementEntryType::Expense,
            occurredAt: now()->toDateString(),
            categoryId: $category->id,
        ));
    }

    /**
     * Segundo contexto de exemplo (empresa) — só para o dashboard
     * consolidado ter o que consolidar de verdade (D-03), sem misturar
     * com o saldo da conta PF acima.
     */
    private function seedDemoCompanyContext(User $user): void
    {
        $company = Company::create(['name' => 'Exemplo Serviços LTDA', 'document' => '12345678000199']);

        $context = app(CreateContext::class)->execute(new CreateContextData(
            userId: $user->id,
            type: ContextType::Company,
            name: 'Exemplo Serviços',
            companyId: $company->id,
        ));

        app(RegisterAccount::class)->execute(new RegisterAccountData(
            contextId: $context->id,
            name: 'Conta PJ',
            institution: 'Banco de teste',
            initialBalance: 5000.0,
        ));

        app(CreateCategory::class)->execute(new CreateCategoryData(
            contextId: $context->id,
            name: 'Despesas operacionais',
            type: CategoryType::Expense,
        ));
        app(CreateCategory::class)->execute(new CreateCategoryData(
            contextId: $context->id,
            name: 'Receita de serviços',
            type: CategoryType::Income,
        ));
    }
}
