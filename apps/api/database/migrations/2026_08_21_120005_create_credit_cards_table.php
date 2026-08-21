<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cartão de crédito de cadastro manual (capítulo 08 do documento de
     * concepção). `closing_day`/`due_day` alimentam a geração de
     * {@see CardInvoice} — a lógica de qual fatura um lançamento pertence
     * fica no caso de uso, não aqui.
     */
    public function up(): void
    {
        Schema::create('credit_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('brand')->nullable();
            $table->unsignedTinyInteger('closing_day');
            $table->unsignedTinyInteger('due_day');
            $table->decimal('credit_limit', 14, 2)->nullable();
            $table->timestamps();

            $table->index('context_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_cards');
    }
};
