# Progresso — apps/web (F0)

Atualizado em 2026-08-21 (polimento: toasts + filtros).

## Feito

- Scaffold React 19 + Vite + TypeScript em `apps/web`
- Ligado à API real + MFA/TOTP, category.type, contextos PF+PJ, 422, faturas
- **Toasts globais** de sucesso nos cadastros (conta, boleto, lançamento,
  cartão/fatura, investimento, categoria, MFA)
- **Filtro de período (mês)** em lançamentos e boletos (client-side; API
  ainda não filtra) — default = mês atual, opção “Todos”
- Dashboard: removido o card “Limite usado” enquanto a API não expõe
  `credit_used` (evita métrica sempre zerada)
- `npm run build` ok

## Falta / pendências

- **Exclusão (DELETE)** — aguardando endpoints na API; **não** implementar
  botão de apagar até lá
- `Account.type` na API (hoje assume `checking` na leitura)
- Workflow `deploy-web.yml`
- Edição de registros (PATCH), quando a API existir

## Próximo passo concreto

1. Quando os destroys da API subirem, plugar botões de exclusão + toast.
2. Revisar/mergear PR #1.
