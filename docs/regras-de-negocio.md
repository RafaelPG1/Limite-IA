# Regras de negócio

Resumo das regras implementadas em `js/core/`. Os testes em `tests/` são a especificação executável.

- **Nome:** obrigatório, primeira letra maiúscula, único (ignora maiúscula, acento e espaços).
- **Campos:** texto até 80 caracteres; observações até 200. Estado é opcional (`livre`/`ok` são reconhecidos e mostrados como `LIVRE`/`OK`).
- **Horário:** `19` vira `19:00`; `1930` vira `19:30`. Valores impossíveis não são salvos.
- **Data:** obrigatória e automática. Vazia = dia da **próxima ocorrência** do horário (sem horário, hoje). Aceita só o dia (`27`), dia/mês (`27/11`) ou completa; anos de 2000 a 2099.
- **Edição:** a data nunca muda sozinha. Ao mudar o horário sem mexer na data, o site pergunta em que dia vale.
- **Atingido:** a linha fica verde quando **data + horário** chegam (relógio do aparelho) e segue assim até editar. Enquanto isso mostra "faltam …".
- **Ordem:** `LIVRE` primeiro, depois `OK`, depois os demais; dentro de cada grupo, por Horário (menor data, depois menor hora; sem horário por último) ou por Nome.
- **Cores:** âmbar = LIVRE, azul = OK, verde = atingido, neutro = esperando.
- **Histórico:** por aparelho; cada entrada expira em 1 dia útil (`DIAS_UTEIS` em `js/core/historico.js`). Não sincroniza.
- **Anotações:** por registro, só no aparelho; saem junto com o registro (e voltam com Desfazer). Veja `docs/uso.md`.
- **Aviso na aba:** bolinha verde no ícone e `(N)` no título quando um horário chega com a aba sem foco.
