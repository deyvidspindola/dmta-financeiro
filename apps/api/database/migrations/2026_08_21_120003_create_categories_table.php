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
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('context_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->index(['context_id', 'parent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
