<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Regras que geram senha candidata pra abrir PDF de boleto protegido,
     * por domínio de remetente (DT-07). Não guarda a senha em si — ela é
     * derivada de `rule_params` toda vez que é preciso tentar (ver
     * `App\Enums\BoletoPasswordRuleType` pro formato de cada tipo).
     */
    public function up(): void
    {
        Schema::create('boleto_password_rules', function (Blueprint $table) {
            $table->id();
            $table->string('sender_domain')
                ->comment('Domínio do e-mail do remetente do boleto (ex.: "banco.com.br"), sempre minúsculo');
            $table->string('rule_type', 20)
                ->comment('cpf_digits | cnpj_digits | birth_date | fixed — ver App\\Enums\\BoletoPasswordRuleType');
            $table->json('rule_params')->comment('Dado bruto pra gerar a(s) candidata(s) — formato depende de rule_type');
            $table->string('label')->nullable()->comment('Nota livre pra identificar a regra na tela (ex.: "Itaú — CPF do titular")');
            $table->timestamp('last_used_at')->nullable()->comment('Última vez que uma candidata gerada por esta regra abriu um boleto de verdade');
            $table->timestamps();

            $table->index('sender_domain');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boleto_password_rules');
    }
};
