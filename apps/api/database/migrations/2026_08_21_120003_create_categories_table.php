<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Categoria/subcategoria de lançamento (D-12), autorreferente via
     * `parent_id`. Escopada por `context_id`: categorias de um contexto
     * nunca aparecem em outro, mesmo que o nome coincida — cadastro é
     * sempre via modal (nunca uma tela de CRUD dedicada).
     *
     * `type` separa categorias de despesa das de receita — uma
     * subcategoria sempre herda o tipo da categoria-mãe (checado no caso
     * de uso `CreateCategory`, não aqui). Lançamento do tipo `transfer`
     * não usa categoria.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('name');
            $table->string('type', 20)->comment('expense | income — ver App\\Enums\\CategoryType');
            $table->timestamps();

            $table->index(['context_id', 'parent_id']);
            $table->index(['context_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
