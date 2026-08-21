<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fatura de um cartão, uma linha por mês de referência. F0 cadastra a
     * fatura em si (valor total, status) manualmente — o detalhamento por
     * lançamento fica para uma fase seguinte.
     */
    public function up(): void
    {
        Schema::create('card_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_card_id')->constrained()->cascadeOnDelete();
            $table->date('reference_month')->comment('Sempre dia 1 do mês de referência');
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->string('status', 20)->default('open')->comment('open | closed | paid — ver App\\Enums\\CardInvoiceStatus');
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['credit_card_id', 'reference_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('card_invoices');
    }
};
