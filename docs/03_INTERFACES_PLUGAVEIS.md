# Interfaces plugáveis — DT-03 e DT-05

Princípio único: **todo canal de captura entra pelo mesmo caso de uso**, e todo
canal externo é uma implementação de interface trocável — não uma chamada
direta a um SDK espalhada pelo código. Isso é o que permite ligar o Pluggy
depois (F2) sem tocar em nada que já está rodando desde a F0/F1.

## 1. `TransactionCaptureChannelInterface` — contrato comum

```php
namespace App\Domain\Capture;

/**
 * Contrato comum a qualquer canal que produz um lançamento pendente de
 * confirmação (boleto, despesa, receita) a partir de uma fonte externa.
 *
 * Implementações NUNCA gravam no banco diretamente — devolvem um DTO que o
 * caso de uso RegisterTransaction consome. Isso mantém a regra de negócio
 * (limites, categoria padrão, contexto PF/PJ) num único lugar.
 *
 * @package App\Domain\Capture
 */
interface TransactionCaptureChannelInterface
{
    /**
     * Identifica a origem para o campo `origin` do lançamento.
     *
     * @return string Uma das constantes de CaptureOrigin (email, telegram, manual, scanner, aggregator).
     */
    public function origin(): string;
}
```

## 2. Motor de e-mail — `EmailBoletoReaderInterface`

```php
namespace App\Domain\Capture;

/**
 * Lê um anexo de e-mail (PDF de boleto) e extrai os dados necessários para
 * pré-cadastrar um lançamento como pendência de confirmação.
 *
 * A implementação de produção (F1) usa leitura de código de barras via
 * biblioteca baseada em ZXing. Não decide categoria nem confirma o
 * lançamento — só extrai dado bruto.
 *
 * @package App\Domain\Capture
 */
interface EmailBoletoReaderInterface extends TransactionCaptureChannelInterface
{
    /**
     * Extrai os dados do boleto a partir do caminho de um PDF já baixado.
     *
     * @param string $pdfPath Caminho local do PDF anexado ao e-mail.
     * @return BoletoDraftData Linha digitável, valor, vencimento, beneficiário (quando legível).
     *
     * @throws UnreadableBoletoException Se o código de barras não for decodificável.
     */
    public function readAttachment(string $pdfPath): BoletoDraftData;
}
```

**Como o e-mail chega até aqui (F1):** uma caixa IMAP dedicada
(`boletos@seudominio.com.br`), consultada pelo mesmo `schedule:run` que já
processa a fila (padrão DMTA, sem worker permanente). Um Job
(`app/Jobs/PollBoletoMailbox.php`) baixa anexos novos, chama a implementação
de `EmailBoletoReaderInterface` vinculada no container, e entrega o
`BoletoDraftData` ao caso de uso `RegisterBill`. Trocar IMAP por webhook de
provedor (Mailgun/SendGrid inbound) no futuro significa só trocar o que
dispara o Job — a interface e o caso de uso não mudam.

## 3. Bot do Telegram — `QuickEntryChannelInterface`

```php
namespace App\Domain\Capture;

/**
 * Interpreta uma mensagem de texto recebida do bot do Telegram e produz um
 * rascunho de lançamento (despesa, receita ou boleto).
 *
 * F1 usa conversa guiada (pergunta valor → categoria → contexto quando
 * faltar informação) — evita depender de NLP. Uma implementação futura mais
 * sofisticada pode substituir esta sem mudar o Controller do webhook.
 *
 * @package App\Domain\Capture
 */
interface QuickEntryChannelInterface extends TransactionCaptureChannelInterface
{
    /**
     * Interpreta uma mensagem recebida e devolve o rascunho, ou null se a
     * mensagem não corresponde a um lançamento (ex.: comando de ajuda).
     *
     * @param string $chatId Identificador da conversa no Telegram (liga ao usuário).
     * @param string $message Texto recebido.
     * @return TransactionDraftData|null
     */
    public function parseMessage(string $chatId, string $message): ?TransactionDraftData;
}
```

**Como chega até aqui (F1):** webhook do Telegram Bot API aponta para
`POST /api/v1/webhooks/telegram`, que delega para a implementação vinculada
e passa o resultado ao mesmo `RegisterTransaction`. Pacote sugerido:
`irazasyed/telegram-bot-sdk` (ver regra de "antes de instalar um pacote" do
padrão DMTA — cliente HTTP de API de terceiro é um caso legítimo de exceção,
reimplementar um cliente Telegram do zero não paga).

## 4. Agregador bancário — `BankAggregatorInterface` (Pluggy, desligado por padrão)

```php
namespace App\Domain\Aggregator;

/**
 * Contrato para qualquer agregador de Open Finance que sincronize contas,
 * saldos e extratos. A implementação de produção (Pluggy) só é vinculada
 * quando AGGREGATOR_ENABLED=true no .env — por padrão, o container resolve
 * para NullBankAggregator, que não faz nada e não exige nenhuma credencial.
 *
 * @package App\Domain\Aggregator
 */
interface BankAggregatorInterface
{
    /** @return bool Se este agregador está de fato configurado e utilizável. */
    public function isEnabled(): bool;

    /**
     * Sincroniza contas e extratos de uma conexão já consentida pelo usuário.
     *
     * @param AggregatorConnection $connection
     * @return SyncResult Quantidade de itens novos e eventuais erros.
     */
    public function sync(AggregatorConnection $connection): SyncResult;
}
```

`NullBankAggregator implements BankAggregatorInterface` devolve `isEnabled(): false`
e lança `AggregatorDisabledException` se `sync()` for chamado — assim, se algo
tentar usar o agregador antes da F2, o erro é claro e imediato, não um
silêncio confuso.

Vínculo no `AppServiceProvider` (ou um `AggregatorServiceProvider` dedicado):

```php
$this->app->bind(BankAggregatorInterface::class, function () {
    return config('services.aggregator.enabled')
        ? PluggyAggregator::class
        : NullBankAggregator::class;
});
```

Isso é literalmente a diferença entre F1 (tudo manual + e-mail + Telegram) e
F2 (Pluggy ligado): uma linha de config, zero mudança nos casos de uso.

## Origem do lançamento — `CaptureOrigin`

```php
namespace App\Enums;

enum CaptureOrigin: string
{
    case Manual = 'manual';
    case Email = 'email';
    case Telegram = 'telegram';
    case Scanner = 'scanner';
    case Aggregator = 'aggregator';
}
```

Todo lançamento grava sua origem (coluna `origin`, capítulo 12 do documento de
concepção). Isso não é cosmético: é o que permite a tela mostrar "vindo do
Telegram, aguardando confirmação" em vez de misturar dado automático com dado
digitado como se tivessem o mesmo nível de confiança.
