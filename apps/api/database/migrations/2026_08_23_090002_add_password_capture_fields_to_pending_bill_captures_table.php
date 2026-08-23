<?php

declare(strict_types=1);

use App\Domain\Capture\PdfPasswordResolverInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Suporte a boleto com PDF protegido por senha (DT-07): quando
     * nenhuma senha candidata abre o arquivo, a pendência vira
     * `status: password_required` em vez de ser descartada — guarda o
     * remetente (pra {@see PdfPasswordResolverInterface})
     * e o caminho do PDF original cifrado (fora de `public/`, pra
     * resolver manualmente depois).
     */
    public function up(): void
    {
        Schema::table('pending_bill_captures', function (Blueprint $table) {
            $table->string('sender_email')->nullable()->after('origin')
                ->comment('E-mail de quem enviou o boleto — usado por PdfPasswordResolverInterface::resolveCandidates()');
            $table->string('encrypted_pdf_path')->nullable()->after('beneficiary')
                ->comment('Caminho em storage/app/private do PDF original ainda cifrado — só preenchido quando status é password_required');
        });
    }

    public function down(): void
    {
        Schema::table('pending_bill_captures', function (Blueprint $table) {
            $table->dropColumn(['sender_email', 'encrypted_pdf_path']);
        });
    }
};
