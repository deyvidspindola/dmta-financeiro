<?php

use App\Models\Bill;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fila de boletos capturados por canal automático (e-mail, Telegram
     * no futuro), aguardando revisão humana antes de virar um
     * {@see Bill} de verdade. Não tem `context_id` — a caixa
     * de e-mail é única para PF e PJ, não tem como saber de qual
     * contexto é um boleto antes de alguém olhar (ver
     * `docs/03_INTERFACES_PLUGAVEIS.md`); é exatamente por isso que esta
     * tabela existe separada de `bills`, que exige contexto sempre.
     */
    public function up(): void
    {
        Schema::create('pending_bill_captures', function (Blueprint $table) {
            $table->id();
            $table->string('origin', 20)->comment('email | telegram — ver App\\Enums\\CaptureOrigin');
            $table->string('source_reference')->nullable()->unique()
                ->comment('ID da mensagem de origem (Message-ID do e-mail) — evita processar o mesmo boleto duas vezes');
            $table->string('linha_digitavel')->nullable();
            $table->decimal('amount', 14, 2)->nullable();
            $table->date('due_date')->nullable();
            $table->string('beneficiary')->nullable();
            $table->string('status', 20)->default('pending')
                ->comment('pending | confirmed | rejected — ver App\\Enums\\CaptureStatus');
            $table->foreignId('bill_id')->nullable()->constrained()->nullOnDelete()
                ->comment('Preenchido só depois de confirmado, ligando à Bill de verdade criada');
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_bill_captures');
    }
};
