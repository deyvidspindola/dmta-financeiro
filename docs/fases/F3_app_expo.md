# F3 — App Expo

Recomendação do documento de concepção (capítulo 11): lançar com escopo
enxuto, não com paridade total em relação ao `apps/web`. Duas telas para toda
funcionalidade nova (web + Expo) tem custo de manutenção real — não finja que
não tem.

## Escopo mínimo (v1 do app)

- [ ] `apps/mobile` — projeto Expo (SDK 55 / React Native 0.83 ou o que for
      atual no momento da implementação — confirmar por busca antes de fixar
      versão, regra do documento técnico).
- [ ] Login via Sanctum (mesmo token que o `apps/web`, API `/api/v1`).
- [ ] Biometria no primeiro acesso após login (D-10).
- [ ] Dashboard consolidado + dashboard PF (leitura).
- [ ] Lançamento manual rápido (despesa/receita) — a versão mobile do "até 3
      cliques para o essencial" (capítulo 2.5).
- [ ] Scanner de código de barras (câmera) para boletos — capítulo 04.4,
      canal "scanner", mesma interface `TransactionCaptureChannelInterface`.
- [ ] Lista de pendências de confirmação (e-mail/Telegram/agregador), com
      ação de confirmar/editar direto do celular.
- [ ] `build-mobile.yml` habilitado, primeiro build de preview gerado via EAS.

## Fora de escopo na v1
Simulador completo com gráficos (fica só no `apps/web` por ora — telas de
gráfico denso não compensam o esforço de porte numa v1 enxuta), cadastro de
cartão/investimento (fluxo de cadastro longo, melhor no desktop), conexão
Pluggy pela primeira vez (fluxo de consentimento web funciona melhor em tela
grande — o app só lê contas já conectadas via web).

## Pronto quando
Você instala o app via build de preview do EAS no seu Android, loga,
confirma um lançamento pendente vindo do Telegram, e cadastra um lançamento
manual rápido — tudo sem abrir o `apps/web`.
