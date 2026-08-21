# Laravel Base (DMTA)

Laravel 13 · Livewire 4 · TallStackUI 3 · Tailwind 4 · MySQL 8 · PHP 8.3 ·
PSR-12. Template reutilizável — uma única área autenticada: `/admin`.

## Idioma

Inglês: classe, arquivo, método, variável, tabela, coluna, nome de rota.
Português: URL da rota (`/admin/usuarios`), rótulo, mensagem, PHPDoc,
comentário. Todo texto exibido vai em `lang/pt_BR/`. Nunca escreva
português dentro de Blade ou PHP fora de `lang/`.

## Onde cada coisa mora

- Intenção do usuário → `app/UseCases/{Auth|Admin}/` — `final`, um `execute()`
- Lógica usada em 2+ lugares → `app/Services/*Service.php`
- Cálculo puro → `app/Domain/`
- Formatação sem lógica → `app/Support/helpers.php`
- Autorização → `app/Policies/`
- Efeito demorado → `app/Jobs/`

## Proibido

- Regra de negócio em controller, Livewire, model ou helper
- `DB::transaction()` fora de caso de uso · query em Blade · `env()` fora de `config/`
- Duplicar lógica — na 2ª ocorrência, extraia um Service
- `style=` inline · jQuery · `spatie/laravel-permission` · Filament
- Componente TallStackUI usado direto numa tela de negócio sem wrapper

## Limites (linhas)

UseCase 120 · Service 200 · Domain 250 · Livewire 150 · Model 150 ·
Controller 80 · Blade 200 · método 30 · parâmetros 4

## Sempre

- PHPDoc em toda classe e método público: o que faz, **o que não faz**, o
  que pode dar errado
- Não crie arquivo que não foi pedido. Não escreva teste a menos que
  peçam
- `make check` antes de qualquer commit

## Referência

`CONVENTIONS.md` (regras completas) · `README.md` (como usar este
template para começar um projeto novo)
