<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Capture\EmailBoletoReaderInterface;
use App\Domain\Capture\PdfBoletoReader;
use App\Domain\Capture\PdfDecryption\EncryptedPdfDecryptor;
use App\Domain\Capture\PdfPasswordResolverInterface;
use App\Domain\Capture\QuickEntryChannelInterface;
use App\Domain\Capture\RuleBasedPasswordResolver;
use App\Domain\Capture\TelegramQuickEntryChannel;
use App\Models\IntegrationSettings;
use App\Services\StatementParsers\BradescoParser;
use App\Services\StatementParsers\C6BankParser;
use App\Services\StatementParsers\InterParser;
use App\Services\StatementParsers\ItauParser;
use App\Services\StatementParsers\NubankParser;
use App\Services\StatementPdfExtractor;
use Illuminate\Support\ServiceProvider;
use Smalot\PdfParser\Config as PdfParserConfig;
use Smalot\PdfParser\Parser as PdfParser;
use Throwable;

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

        // Lançamento rápido via bot do Telegram (capítulo 6.4) — conversa
        // guiada sem NLP; trocar por algo mais esperto é mudar só esta linha.
        $this->app->bind(QuickEntryChannelInterface::class, TelegramQuickEntryChannel::class);

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

        // Motores de extrato em PDF por banco (leia-se: cada item da
        // lista sabe reconhecer e ler o layout de um banco só) — ordem
        // importa, StatementPdfExtractor usa o primeiro que reconhecer o
        // texto. Novo banco = nova classe aqui, nada mais muda.
        $this->app->bind(StatementPdfExtractor::class, function ($app): StatementPdfExtractor {
            return new StatementPdfExtractor(
                $app->make(EncryptedPdfDecryptor::class),
                $app->make(PdfPasswordResolverInterface::class),
                $app->make(PdfParser::class),
                [
                    $app->make(BradescoParser::class),
                    $app->make(ItauParser::class),
                    $app->make(NubankParser::class),
                    $app->make(InterParser::class),
                    $app->make(C6BankParser::class),
                ],
            );
        });
    }

    /**
     * Executa rotinas de bootstrap da aplicação.
     */
    public function boot(): void
    {
        $this->applyIntegrationSettingsFromDatabase();
    }

    /**
     * Sobrepõe `config('services.telegram.*')` e
     * `config('services.boleto_mailbox.*')` com o que estiver salvo em
     * {@see IntegrationSettings} (tela de integrações). O `.env` continua
     * sendo o fallback de cada chave não preenchida na tela.
     *
     * Falha em silêncio se a tabela ainda não existe (deploy antes da
     * migration, CI de banco limpo) ou o banco não responde no boot — a
     * app sobe igual, só sem o overlay.
     */
    private function applyIntegrationSettingsFromDatabase(): void
    {
        try {
            $settings = IntegrationSettings::query()->first();
        } catch (Throwable) {
            return;
        }

        if ($settings !== null) {
            config($settings->servicesConfigOverrides());
        }
    }
}
