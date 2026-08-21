<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Boleto a pagar ou a receber. `origin` grava de onde o boleto veio
     * (manual nesta fase; e-mail/Telegram na F1) — ver
     * `docs/03_INTERFACES_PLUGAVEIS.md`, seção "Origem do lançamento".
     * Ao ser confirmado como pago, o caso de uso que processa o pagamento
     * cria um {@see StatementEntry} vinculado (`bill_id`) — este registro
     * nunca move saldo de conta sozinho.
     */
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->decimal('amount', 14, 2);
            $table->date('due_date');
            $table->string('direction', 20)->comment('payable | receivable — ver App\\Enums\\BillDirection');
            $table->string('status', 20)->default('pending')->comment('pending | paid | overdue | cancelled — ver App\\Enums\\BillStatus');
            $table->string('origin', 20)->default('manual')->comment('ver App\\Enums\\CaptureOrigin');
            $table->string('barcode')->nullable()->comment('Linha digitável, quando capturado por leitura');
            $table->string('beneficiary')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['context_id', 'status', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
