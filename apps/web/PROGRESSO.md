# Progresso — apps/web (F0 + início F1)

Atualizado em 2026-08-21 (capturas validadas — inclusive campo ausente).

## Feito

- Scaffold React 19 + Vite + TypeScript em `apps/web`
- Ligado à API real + MFA/TOTP, category.type, contextos PF+PJ, 422, faturas
- Toasts, filtros de mês, DELETE/PATCH nos cadastros F0
- **Account.type** real (`checking | savings | wallet | other`)
- **F1 captura (D-06):** tela `/bill-captures` — lista pendências,
  confirmar (escolhe contexto + form editável) e rejeitar; badge de origem
  (e-mail); menu “Capturas”
- Teste manual ok: listar, confirmar → Bill com `origin: email`, rejeitar,
  e pendência sem `due_date` (lista “—”, form exige preencher)
- `npm run build` ok

## Falta / pendências

- Workflow `deploy-web.yml`
- Filtro de período server-side, se a API passar a aceitar query params
- IMAP real (caixa de e-mail) — depende de passo manual; tela já funciona
  com pendências criadas via API/factory

## Próximo passo concreto

1. Revisar/mergear PR #1.
2. Quando a caixa IMAP estiver ligada, validar captura ponta a ponta.
