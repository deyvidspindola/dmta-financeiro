# Convenções — Laravel Base (DMTA)

Este documento é a referência normativa de arquitetura, nomenclatura e
limites de código deste template e de qualquer projeto derivado dele.
Se um agente (Claude Code, Cursor) ou uma pessoa nova no time precisar
saber "onde isso deveria morar", a resposta está aqui.

## Stack

PHP 8.3+, Laravel 13, MySQL 8, PSR-12 via `laravel/pint`, Pest para testes,
Larastan nível 5 (sobe conforme o projeto amadurece), Sentry
(`sentry/sentry-laravel`), fila via driver `database` processada só pelo
`schedule:run` (**nunca** `queue:work` como serviço permanente).

Para UI própria: Livewire 4 + TallStackUI 3 + Tailwind CSS 4 + Alpine.js 3.
**Nunca** usar Filament ou `spatie/laravel-permission` (papéis fixos, quando
existirem, usam Gates/Policies nativos do Laravel).

TallStackUI nunca é usado direto numa tela de negócio: todo componente
passa por um wrapper próprio em `resources/views/components/` (ex.:
`<x-form.input>` por dentro chama `<x-input>` do TallStackUI). O wrapper
existe para que, se um dia a lib trocar, só ele mude — nenhuma tela de
negócio conhece o nome real do componente da biblioteca. Componentes que
são puro chrome de layout (ícone, toast, dialog, card usado como caixa)
podem ser usados via wrapper simples de passagem, como já é o caso de
`x-ui.icon`, `x-ui.card` e `x-ui.button` neste template — a régua é: se a
tela de negócio importaria a lib diretamente, precisa de wrapper.

## Ambiente

Hospedagem compartilhada (HostGator/cPanel ou equivalente) é a produção
padrão. Sem processo permanente: sem `queue:work`, sem Redis, sem
WebSocket. Cron de 1 minuto rodando `php artisan schedule:run`. Document
root do domínio aponta só para `public/`, nunca para o projeto inteiro.
`APP_DEBUG=false` em produção. Depois de `config:cache`, `env()` devolve
`null` fora de `config/` — use `config()` no código de negócio, nunca
`env()` direto. `migrate` roda com `artisan down`/`up` (sem zero-downtime,
ver `bin/deploy.sh`). O Docker local replica essas restrições: mesmas
versões de PHP/MySQL, mesmo `memory_limit`, sem Redis/worker
permanente/WebSocket.

## Arquitetura (Clean Architecture adaptada)

De fora para dentro. Nenhuma seta volta.

```
Controller/Livewire  →  UseCase  →  Service  →  Domain  →  Model  →  Helper
```

- **Controller/Livewire** — localiza, autoriza (`$this->authorize()`),
  delega, formata resposta. **Nunca** regra de negócio.
- **UseCase** (`app/UseCases/`) — uma intenção do usuário, do início ao
  fim. `final`, um `execute()`, dependências injetadas no método ou no
  construtor. Abre `DB::transaction()` quando escreve em mais de uma
  tabela — e só aqui.
- **Service** (`app/Services/`) — lógica reutilizada por 2+ casos de uso.
  Sem estado, sem transação própria, não conhece request nem sessão.
- **Domain** (`app/Domain/`) — regra pura calculável, sem Eloquent quando
  evitável. Testável sem banco sempre que possível.
- **Model** (`app/Models/`) — fillable, casts, relações, scopes. Nunca
  regra de negócio.
- **Helper** (`app/Support/helpers.php`) — só formatação pura, até 10
  linhas por função, sem banco.

**Teste Service vs UseCase**: um usuário clicaria um botão com esse nome?
Sim → UseCase (`ValidarCheckIn`). Não → Service (`RegistrarAuditoria`).

## Estrutura de pastas (`app/`)

```
Domain/            Cálculo puro
UseCases/           Uma intenção do usuário por classe (ex.: Auth/, Admin/User/)
Services/          Lógica reutilizada por 2+ casos de uso
Models/            Eloquent — fillable, casts, relações, scopes
Http/
  Controllers/     No máximo delega
  Middleware/
  Requests/        Validação de formulário tradicional (não-Livewire)
  Resources/       Formatação de resposta de API
Livewire/          Componentes de tela, por área (ex.: Admin/, Auth/)
DTOs/              Quando um método passaria de 4 parâmetros
Enums/
Policies/          Autorização (Gate nativo)
Jobs/              Efeito demorado, processado pelo scheduler
Notifications/
Exceptions/Domain/ Exceções de regra de negócio

resources/views/components/  Wrappers de UI (form/, ui/, admin/)
lang/pt_BR/                   Todo texto exibido na tela
tests/Feature/
```

## 5 princípios

1. Um arquivo, uma responsabilidade.
2. Zero duplicação — na 2ª ocorrência da mesma lógica, vira Service.
3. Lógica tem endereço fixo (UseCase/Service/Domain), nunca
   controller/model/helper.
4. Inglês no código: classe, método, variável, tabela, coluna, nome de
   rota. Português na tela: rótulo, mensagem — tudo em `lang/pt_BR/`. A
   URL da rota também é em português (kebab-case), mesmo o nome da rota
   sendo em inglês.
5. Documentado antes de estar pronto — PHPDoc obrigatório (ver abaixo).

## Nomenclatura

| Elemento | Padrão |
|---|---|
| Classe / arquivo | PascalCase, inglês |
| Método / variável | camelCase, inglês |
| Tabela | plural, snake_case, inglês |
| Coluna | snake_case, inglês |
| Nome de rota | kebab-case, inglês (`admin.users.index`) |
| URL de rota | português, kebab-case (`/admin/usuarios`) |
| Componente Blade | kebab-case, inglês (`x-form.input`) |
| Rótulo / mensagem | português |
| PHPDoc / comentário | português |

## PHPDoc obrigatório

Toda classe (bloco com o que faz, o que **não** faz, o que pode dar
errado — `@package`, `@author`, `@version 1.0.0`, `@since`, `@updated`) e
todo método público (`@param` com o **significado no negócio**,
`@return`, `@throws`).

## Limites de tamanho

| Tipo | Linhas |
|---|---|
| UseCase | 120 |
| Service | 200 |
| Domain | 250 |
| Livewire | 150 |
| Model | 150 |
| Controller | 80 |
| Blade | 200 |
| Método | 30 |
| Parâmetros de método | 4 (senão, DTO em `app/DTOs/`) |
| Helper (por função) | 10 |

`bin/check-standards.php` verifica os limites automaticamente (`make
standards` / CI).

## Checklist de commit

- [ ] `./vendor/bin/pint` rodado
- [ ] PHPDoc completo em toda classe nova
- [ ] Nenhum arquivo passou do limite de tamanho
- [ ] Nenhum `if` de regra de negócio em controller/model/helper
- [ ] Nenhuma lógica duplicada
- [ ] Texto novo em `lang/pt_BR/`
- [ ] Componente TallStackUI novo envolvido em wrapper próprio
- [ ] `php artisan test` passa

`make check` roda tudo isso de uma vez (é o hook de pre-commit instalado
por `make setup`).
