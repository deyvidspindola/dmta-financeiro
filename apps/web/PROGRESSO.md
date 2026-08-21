# Progresso — apps/web (F0 + F1)

Atualizado em 2026-08-21 (empresa, lançamentos avançados, consolidado).

## Feito

- Scaffold + API real, MFA, PATCH/DELETE, categorias, capturas, basename `/app`
- **Empresas:** `POST /contexts` (company + context) — tela `/companies`
- **Lançamentos:** editar (PATCH), transferir (`POST .../transfers`), mover
  de contexto (`.../move`); ícones; sem editar perna de transferência/boleto
- **Recorrências:** tela `/recurring` (GET/POST/DELETE)
- **Consolidado:** contas, lançamentos e boletos via `/consolidated/...`
  com coluna de contexto
- `npm run build` ok

## Falta / pendências

- IMAP real (caixa de e-mail)
- Filtro de período server-side (se a API passar a aceitar)

## Próximo passo concreto

1. Mergear este PR.
2. Validar fluxos novos contra API em staging/produção.
