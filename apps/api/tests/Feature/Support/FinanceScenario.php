<?php

declare(strict_types=1);

namespace Tests\Feature\Support;

use App\Enums\AccountType;
use App\Enums\CategoryType;
use App\Enums\ContextType;
use App\Models\Account;
use App\Models\Category;
use App\Models\Context;
use App\Models\User;

/**
 * Monta um cenário financeiro coerente para os testes de Feature: um
 * usuário dono, um contexto PF e, opcionalmente, um contexto de empresa —
 * cada conta e categoria criada aqui tem o `context_id` batendo de
 * verdade com o contexto ao qual pertence, coisa que as factories cruas
 * (`Account::factory()`, `Category::factory()`) não garantem porque
 * geram um `Context` novo e solto.
 *
 * O que NÃO faz: não cria lançamentos, não mexe em saldo, não emite
 * requisição HTTP. Movimentar dinheiro é papel de cada teste, sempre
 * através dos casos de uso reais — este builder só prepara o terreno.
 */
final class FinanceScenario
{
    private function __construct(
        public readonly User $user,
        public readonly Context $pf,
        public ?Context $company = null,
    ) {}

    /** Usuário novo + contexto PF "Pessoal". */
    public static function create(): self
    {
        $user = User::factory()->create();

        $pf = Context::factory()->for($user)->create([
            'type' => ContextType::Pf->value,
            'name' => 'Pessoal',
        ]);

        return new self($user, $pf);
    }

    /** Adiciona um contexto de empresa (com `Company` própria) ao mesmo usuário. */
    public function withCompany(string $name = 'Empresa Exemplo'): self
    {
        $this->company = Context::factory()
            ->for($this->user)
            ->company()
            ->create(['name' => $name]);

        return $this;
    }

    /** Conta no contexto informado (PF por padrão), com `balance` e `initial_balance` iguais ao valor dado. */
    public function account(
        ?Context $context = null,
        float $balance = 0.0,
        AccountType $type = AccountType::Checking,
    ): Account {
        return Account::factory()->for($context ?? $this->pf)->create([
            'type' => $type->value,
            'initial_balance' => $balance,
            'balance' => $balance,
        ]);
    }

    /** Categoria no contexto informado (PF por padrão); passe `$parent` para criar subcategoria. */
    public function category(
        ?Context $context = null,
        CategoryType $type = CategoryType::Expense,
        ?Category $parent = null,
    ): Category {
        return Category::factory()->for($context ?? $this->pf)->create([
            'type' => $type->value,
            'parent_id' => $parent?->id,
        ]);
    }
}
