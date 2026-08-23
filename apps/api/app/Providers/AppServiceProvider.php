<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Capture\EmailBoletoReaderInterface;
use App\Domain\Capture\PdfBoletoReader;
use App\Domain\Capture\PdfPasswordResolverInterface;
use App\Domain\Capture\RuleBasedPasswordResolver;
use Illuminate\Support\ServiceProvider;
use Smalot\PdfParser\Config as PdfParserConfig;
use Smalot\PdfParser\Parser as PdfParser;

/**
 * Provider padrão do Laravel para bindings e bootstrap da aplicação.
 *
 * Vazio no template de propósito — cada projeto derivado registra aqui
 * só o que for específico dele (bindings de interface, observers, etc.).
 * Não é lugar para regra de negócio.
 *
 * @package App\Providers
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   18/08/2026
 *
 * @updated 18/08/2026
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Registra serviços da aplicação.
     */
    public function register(): void
    {
        // Único canal de captura por e-mail hoje — trocar por outra
        // implementação (ex.: OCR real) é mudar só esta linha.
        $this->app->bind(EmailBoletoReaderInterface::class, PdfBoletoReader::class);

        // Senha de boleto protegido (DT-07) — hoje só por regra cadastrada
        // (App\Models\BoletoPasswordRule), sem integração externa nenhuma.
        $this->app->bind(PdfPasswordResolverInterface::class, RuleBasedPasswordResolver::class);

        // Maioria dos boletos reais vem com o PDF marcado como "encrypted"
        // (restrição de impressão/cópia do gerador do banco), mas sem senha
        // de usuário de verdade — sem isso o parser recusa o arquivo inteiro
        // com "Secured pdf file are currently not supported.", bug real visto
        // em produção. `ignoreEncryption` é sinalizado como workaround
        // temporário pela própria lib (smalot/pdfparser#653), mas é
        // exatamente o caso de boleto: não tem conteúdo protegido de fato.
        $this->app->singleton(PdfParser::class, function (): PdfParser {
            $config = new PdfParserConfig;
            $config->setIgnoreEncryption(true);

            return new PdfParser([], $config);
        });
    }

    /**
     * Executa rotinas de bootstrap da aplicação.
     */
    public function boot(): void
    {
        //
    }
}
