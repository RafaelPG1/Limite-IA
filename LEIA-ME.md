# Registros — tabela dinâmica

Site simples (HTML, CSS e JavaScript puros, sem instalar nada) para cadastrar, editar e excluir registros com **Nome** (obrigatório), **Projeto**, **Horário** e **Estado** (opcionais).

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | A página |
| `estilo.css` | Visual (cores no começo do arquivo) |
| `app.js` | Tela: cliques, tabela, relógio |
| `logica.js` | Regras: validar, editar, excluir, salvar |
| `nuvem.js` | Liga o site ao Firestore (sincroniza computador e celular) |
| `firebase-config.js` | Configuração pública do seu projeto Firebase (`limite-tempo`) |
| `firestore.rules` | Regras do banco, para você colar no console do Firebase |
| `historico.js` | Regras do histórico (registrar, filtrar) |
| `icone.svg`, `icone-32.png`, `icone-180.png` | Ícone do site (aba do navegador e tela inicial do celular) |
| `testes.js`, `testes-historico.js` | Testes automáticos das regras |

## Como abrir o site

1. Abra a pasta `registros`.
2. Dê dois cliques em `index.html`. Ele abre no navegador (Chrome, Edge, Firefox ou Safari).

Não precisa de servidor, internet nem instalação.

## Como usar

- **Adicionar:** digite o nome e clique em Adicionar. Os outros campos podem ficar vazios.
- **Horário:** pode digitar só a hora. `19` vira `19:00`; `1930` ou `19:30` vira `19:30`.
- **Data:** pode digitar só o dia. `27` é o dia 27 do mês atual; `27/11` é 27 de novembro. O ano não é necessário (se não digitar, vale o ano atual) e só aparece na tabela quando não for o ano atual.
- **Valor que não existe** (horário 25, dia 31/11): aparece um aviso no campo e o registro não é salvo, para nada ser descartado sem você ver.
- **Observações:** campo opcional. Só aparece na tabela, em letra pequena sob o nome, nos registros em que você escreveu algo. Sem observação, nada é mostrado.
- **Nome:** a primeira letra é sempre maiúscula (digitou `ana`, vira `Ana`; o resto do nome não é mexido). **Não pode haver dois registros com o mesmo nome**, mesmo mudando maiúscula, acento ou espaços (`ana`, `Aná` e ` ANA ` contam como o mesmo). Projeto, horário e estado podem se repetir. Se o nome já existe, aparece um aviso no campo e o registro não é salvo (vale também ao editar e ao desfazer uma exclusão cujo nome já foi reutilizado).
- **Estado LIVRE e OK:** escreva `livre` ou `ok` de qualquer jeito (`Livre`, ` oK `, `lívre`): é reconhecido sozinho e guardado e mostrado como **`LIVRE`** (liberado) e **`OK`** (não liberado, mas tem trabalho lá). A **linha inteira** ganha cor de fundo. São **3 cores, nenhuma repetida**: **âmbar** = `LIVRE`, **azul** = `OK`, **verde** = horário atingido; sem cor especial (fundo normal) = esperando a hora. O texto inteiro precisa ser `livre`/`ok`: `não livre` ou `ok sim` ficam como digitados e sem cor. Se o registro for LIVRE/OK e o horário também for atingido, vale a cor do estado e o selo "Atingido" aparece ao lado do horário. Para trocar a cor do LIVRE, mude `--fundo-livre`, `--borda-livre` e `--livre-fundo` em `estilo.css`.
- **Ordem da lista:** o botão **Ordenar por** (acima da tabela) alterna entre **Horário** (padrão) e **Nome**. A escolha fica guardada neste aparelho.
  - **Horário:** primeiro o **menor dia**, e no mesmo dia o menor horário (dia 29 às 23:00 fica acima de dia 30 às 08:00). Quem não tem horário vai para o fim, em ordem alfabética.
  - **Nome:** alfabética, sem diferenciar maiúscula nem acento (`Item 2` vem antes de `Item 10`).
  - Nos dois modos, o topo da lista é sempre: primeiro os `LIVRE`, depois os `OK`, depois todos os outros (cada grupo ordenado pelo modo escolhido). Ao adicionar ou editar, a linha vai sozinha para o lugar certo.
- **Editar:** clique em Editar na linha. Se você mudar o **horário ou a data**, o "atingido" é recalculado do zero, como se fosse um registro novo: vale o dia e hora (se você mudou só o horário e a data era de um dia passado, a data vira hoje), e a chegada é anotada no histórico quando acontecer. Editar outros campos não anota nada. Cada campo mostra seu nome em cima (Nome, Observações, Projeto, Horário, Data, Estado) e se é opcional. `Enter` salva, `Esc` cancela. Dá para editar a qualquer momento.
- **Excluir:** o botão Excluir abre uma janela perguntando se você quer mesmo apagar aquele registro (mostra o nome). O foco começa em **Cancelar**; `Esc` ou clicar fora também cancelam sem apagar. Depois de confirmar, o aviso "Desfazer" continua aparecendo por alguns segundos.
- **Histórico:** botão **Histórico** no topo abre uma janela com o que aconteceu: criado, editado (mostra o que mudou, ex.: `Horário: 19:00 → 20:00`), excluído e horário atingido. Cada entrada guarda uma cópia de como o registro estava (projeto, horário, data, estado, observações). Três campos de filtro, que funcionam juntos:
  - **Nome:** só procura no nome.
  - **Projeto:** só procura no projeto.
  - **Buscar:** procura em qualquer canto: nome, projeto, estado, observações, horário, data, tipo (`excluído`, `criado`...), o que mudou e o dia/hora em que aconteceu. Com várias palavras, todas precisam aparecer (`loja pendente`). Ignora acento e maiúscula.
  A lixeira de cada entrada apaga só aquela; **Limpar histórico** apaga todas, depois de uma janela de confirmação. Os registros da tabela nunca são afetados. `Esc`, o X ou clicar fora fecham.
- **Excluir:** clique em Excluir. Um aviso aparece por 7 segundos com o botão Desfazer.
- **Verde:** quando o relógio do seu dispositivo chega ao horário do registro, a linha fica verde e aparece "Atingido". O texto do Estado nunca é alterado pela cor.
- **Sem horário:** a linha nunca fica verde. Uma data sozinha (sem horário) só é exibida, não destaca.
- **Data obrigatória e automática:** se você deixar a **Data** vazia, ela é preenchida sozinha com o **dia da próxima vez em que o horário acontece**, a partir de agora. Exemplos às 20:10: `22` é hoje; `00` e `18` são amanhã; sem horário, hoje. Se você digitar a data, ela é respeitada.
- **Editar o horário:** a data **nunca muda sozinha**. Se você muda o horário e não mexe na data, o site pergunta em que dia ele vale: o dia que estava, ou o dia da próxima vez que esse horário acontece (a pergunta só aparece se os dois forem diferentes). "Voltar" deixa você digitar outra data. Se você mudar a data na própria edição, ela vale e não há pergunta. Cada dia tem 24h: dia 30 às 22h pode ser movido para o dia 29 por essa pergunta ou digitando a data.
- **Regra única:** fica verde quando **data + horário** chegam, e continua verde até você editar. Para marcar algo que já passou hoje, digite a data de hoje (ex.: `29`).
- **Tempo que falta:** enquanto o horário não chegou, aparece ao lado dele quanto falta (`faltam 1h 41min`, `faltam 12min 05s`, `faltam 1d 2h`). Atualiza sozinho a cada segundo e some quando o horário chega (aparece o selo "Atingido"). Usa o relógio do seu aparelho.
- **Aviso na aba:** quando um horário chega **e você não está olhando a aba** (outra aba, outra janela ou minimizado), o ícone da aba ganha uma **bolinha verde grande** e o título vira `(1) Registros` (o número conta quantos chegaram). Ao voltar para a aba, volta ao normal. Se nada novo chegou, não há bolinha; horários que já estavam atingidos não contam. Limite: o navegador pode atrasar abas escondidas em até ~1 minuto. Não usa PWA, service worker nem servidor, então não guarda cache e não funciona com o navegador fechado. No Android funciona do mesmo jeito enquanto a página estiver aberta; com o Chrome fechado ou a tela apagada o sistema pode suspender a página e o aviso não aparece.

## Sincronizar computador e celular (Firebase)

O celular não abre arquivo do seu computador, então são dois passos: **publicar as regras** e **colocar a pasta num endereço na internet**.

### 1. Banco e regras (você faz no console; eu não publiquei nada)

1. [console.firebase.google.com](https://console.firebase.google.com) > projeto `limite-tempo` > **Firestore Database**. Se ainda não existir, clique em *Criar banco de dados*, modo **produção**, região `southamerica-east1` (São Paulo).
2. Aba **Regras**. Apague o que estiver lá, cole o conteúdo de `firestore.rules` e clique em **Publicar**.
3. Opcional: em *Regras > Playground de regras*, simule uma gravação em `/registros/teste` para conferir.

### 2. Colocar o site no ar

Pelo menos estes arquivos: `index.html`, `estilo.css`, `app.js`, `logica.js`, `nuvem.js`, `firebase-config.js`.

- **Cloudflare Pages (mais simples):** dash.cloudflare.com > Workers & Pages > Create > Pages > *Upload assets*. Arraste a pasta e publique. Você recebe um endereço `algo.pages.dev`.
- **GitHub Pages:** suba os arquivos num repositório seu e ative Pages nas configurações.

Abra o endereço no computador e no celular. Um registro criado num aparece no outro em poucos segundos.

### Avisos do canto superior

- **Conectando / Sincronizado:** normal.
- **Enviando:** gravação esperando confirmação do servidor.
- **Sem conexão:** funciona e guarda; envia quando a internet voltar. Se a internet está boa e o aviso não some, quase sempre é **extensão bloqueando o Firebase** (bloqueador de anúncios, Brave Shields, privacidade). Teste numa janela anônima sem extensões ou desative a extensão neste site; no console aparece `ERR_BLOCKED_BY_CLIENT`.
- **Erro de permissão:** as regras não foram publicadas, ou rejeitaram o registro.
- **Nuvem indisponível:** o Firebase não carregou; o site segue só neste aparelho.

### Segurança: leia

Sem login, **quem descobrir o endereço do site consegue ler e apagar os registros**. Não guarde nada sensível.

A chave em `firebase-config.js` é pública por natureza do Firebase; não coloque senhas ou tokens ali. As regras não foram testadas contra o Firebase real.

## Comportamentos que você precisa saber

- **Histórico é por aparelho e dura 1 dia útil:** cada entrada some sozinha 1 dia útil depois de criada (segunda a sexta; sábado e domingo não contam, feriados também não): criada na sexta às 15h, some na segunda às 15h. Fica só no navegador de cada aparelho e **não sincroniza** pela nuvem. Registra o que você faz neste aparelho. "Horário atingido" só é anotado com a página aberta no momento em que o horário chega (e repete a cada dia para registros só com horário). Desfazer uma exclusão remove a entrada dela. Para mudar o prazo, `DIAS_UTEIS` no começo de `historico.js`.
- **Onde os dados ficam:** com a nuvem ligada, no Firestore (e uma cópia no aparelho, que funciona sem internet). Sem a nuvem (`firebase-config.js` com `null`), só no navegador (`localStorage`) e outro aparelho não enxerga nada.
- **Registros antigos sem data:** ao abrir, ganham data (a da próxima vez que o horário acontecia depois de criados; sem horário, hoje).
- **Data só com o dia:** `5` significa dia 5 do **mês atual**. Se esse dia já passou, o registro fica verde na hora (se tiver horário). Para o mês seguinte, digite o mês (`5/11`).
- **Datas aceitas:** de 2000 a 2099.
- **Limite:** cada campo de texto aceita até 80 caracteres; observações, até 200.

## Testes automáticos (opcional)

**O que verificam:** cadastro só com nome e com combinações de campos, validação de horário e data (só hora, só dia, dia/mês), observações, edição, exclusão e desfazer, persistência (inclusive dados corrompidos e registros antigos sem data) e a regra do horário/data/verde.

**Ferramenta necessária:** Node.js 18 ou mais novo (baixe em nodejs.org). Para conferir, rode `node --version`.

**Onde abrir o terminal:** dentro da pasta `registros`.
- Windows: abra a pasta no Explorador, clique na barra de endereço, digite `cmd` e Enter.
- Mac/Linux: abra o terminal e use `cd caminho/para/registros`.

**Comando:**

```
node --test testes.js testes-historico.js
```

**Resultado esperado:** no final, `# pass 74` e `# fail 0`.

**Erros comuns:**
- `node não é reconhecido` / `command not found`: o Node.js não está instalado, ou o terminal foi aberto antes da instalação. Instale e abra um terminal novo.
- `Cannot find module './logica.js'`: o terminal está na pasta errada. Confira com `dir` (Windows) ou `ls` (Mac/Linux): `logica.js` deve aparecer na lista.
- `# fail` maior que 0: você alterou `logica.js`. O nome do teste que falhou aparece na saída e diz qual regra quebrou.
