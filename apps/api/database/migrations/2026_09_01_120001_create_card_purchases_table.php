<?php

use App\Domain\CreditCard\InvoiceAllocator;
use App\Models\StatementEntry;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Compra lançada num cartão de crédito. É uma tabela própria, não um
     * {@see StatementEntry} — a definição de `statement_entries` é "o
     * único registro que move `accounts.balance`", e uma compra no cartão
     * NÃO move saldo de conta; ela entra numa fatura, e só o pagamento da
     * fatura vira um `StatementEntry`.
     *
     * `card_invoice_id` é a fatura em que a compra caiu, resolvida pelo
     * `closing_day` do cartão ({@see InvoiceAllocator}).
     * `installment_*` descrevem parcelamento — uma compra em N vezes vira
     * N linhas, uma por fatura, ligadas pelo mesmo `installment_group`.
     * `card_invoices.total_amount` é a soma das compras alocadas, mantida
     * pelo caso de uso (mesmo padrão de `accounts.balance`).
     */
    public function up(): void
    {
        Schema::create('card_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->foreignId('credit_card_id')->constrained()->cascadeOnDelete();
            $table->foreignId('card_invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->decimal('amount', 14, 2);
            $table->date('occurred_at');
            $table->unsignedSmallInteger('installment_number')->nullable();
            $table->unsignedSmallInteger('installment_total')->nullable();
            $table->uuid('installment_group')->nullable();
            $table->timestamps();

            $table->index(['credit_card_id', 'occurred_at']);
            $table->index('installment_group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('card_purchases');
    }
};
