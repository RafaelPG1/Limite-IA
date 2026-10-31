# Como usar

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
- **Editar:** clique em Editar na linha. Mudar o **horário ou a data** recalcula o "atingido" e a chegada é anotada no histórico quando acontecer; editar outros campos não anota nada. A data nunca muda sozinha (veja "Editar o horário" abaixo). Cada campo mostra seu nome em cima (Nome, Observações, Projeto, Horário, Data, Estado) e se é opcional. `Enter` salva, `Esc` cancela. Dá para editar a qualquer momento.
- **Excluir:** o botão Excluir abre uma janela perguntando se você quer mesmo apagar aquele registro (mostra o nome). O foco começa em **Cancelar**; `Esc` ou clicar fora também cancelam sem apagar. Depois de confirmar, o aviso "Desfazer" continua aparecendo por alguns segundos.
- **Histórico:** botão **Histórico** no topo abre uma janela com o que aconteceu: criado, editado (mostra o que mudou, ex.: `Horário: 19:00 → 20:00`), excluído e horário atingido. Cada entrada guarda uma cópia de como o registro estava (projeto, horário, data, estado, observações). Três campos de filtro, que funcionam juntos:
  - **Nome:** só procura no nome.
  - **Projeto:** só procura no projeto.
  - **Buscar:** procura em qualquer canto: nome, projeto, estado, observações, horário, data, tipo (`excluído`, `criado`...), o que mudou e o dia/hora em que aconteceu. Com várias palavras, todas precisam aparecer (`loja pendente`). Ignora acento e maiúscula.
  A lixeira de cada entrada apaga só aquela; **Limpar histórico** apaga todas, depois de uma janela de confirmação. Os registros da tabela nunca são afetados. `Esc`, o X ou clicar fora fecham.
- **Verde:** quando o relógio do seu dispositivo chega ao horário do registro, a linha fica verde e aparece "Atingido". O texto do Estado nunca é alterado pela cor.
- **Sem horário:** a linha nunca fica verde. Uma data sozinha (sem horário) só é exibida, não destaca.
- **Data obrigatória e automática:** se você deixar a **Data** vazia, ela é preenchida sozinha com o **dia da próxima vez em que o horário acontece**, a partir de agora. Exemplos às 20:10: `22` é hoje; `00` e `18` são amanhã; sem horário, hoje. Se você digitar a data, ela é respeitada.
- **Editar o horário:** a data **nunca muda sozinha**. Se você muda o horário e não mexe na data, o site pergunta em que dia ele vale: o dia que estava, ou o dia da próxima vez que esse horário acontece (a pergunta só aparece se os dois forem diferentes). "Voltar" deixa você digitar outra data. Se você mudar a data na própria edição, ela vale e não há pergunta. Cada dia tem 24h: dia 30 às 22h pode ser movido para o dia 29 por essa pergunta ou digitando a data.
- **Regra única:** fica verde quando **data + horário** chegam, e continua verde até você editar. Para marcar algo que já passou hoje, digite a data de hoje (ex.: `29`).
- **Tempo que falta:** enquanto o horário não chegou, aparece ao lado dele quanto falta (`faltam 1h 41min`, `faltam 12min 05s`, `faltam 1d 2h`). Atualiza sozinho a cada segundo e some quando o horário chega (aparece o selo "Atingido"). Usa o relógio do seu aparelho.
- **Aviso na aba:** quando um horário chega **e você não está olhando a aba** (outra aba, outra janela ou minimizado), o ícone da aba ganha uma **bolinha verde grande** e o título vira `(1) Registros` (o número conta quantos chegaram). Ao voltar para a aba, volta ao normal. Se nada novo chegou, não há bolinha; horários que já estavam atingidos não contam. Limite: o navegador pode atrasar abas escondidas em até ~1 minuto. Não usa PWA, service worker nem servidor, então não guarda cache e não funciona com o navegador fechado. No Android funciona do mesmo jeito enquanto a página estiver aberta; com o Chrome fechado ou a tela apagada o sistema pode suspender a página e o aviso não aparece.
- **Senha de acesso (trava simples, não é segurança):**
  - **Uma senha só, para todos os aparelhos.** Ela fica no Firestore, no documento `acesso/senha`, e **não** como texto: o site guarda só `sal` e `hash` (PBKDF2-SHA-256), então o que aparece no console do Firebase são letras e números sem sentido, nunca a senha.
  - No primeiro acesso (quando o documento ainda não existe) o site pede para **criar a senha** (mínimo de 4 caracteres, digitada duas vezes). Depois disso, em qualquer aparelho, a tela só pede a senha. As regras do Firestore **não deixam criar de novo, trocar nem apagar** o documento.
  - Você fica **logado por 24 horas** neste aparelho, contadas do login (não renova sozinho). Passado isso, ou ao clicar em **Sair**, a senha é pedida de novo. O site aberto tranca sozinho quando vencer.
  - **IMPORTANTE, faça uma vez antes de usar:** publique o `firebase/firestore.rules` novo (Console do Firebase > Firestore Database > aba Regras > cole o arquivo inteiro > Publicar). Enquanto as regras antigas estiverem lá, o site mostra "O Firebase ainda não aceita a senha" e fica trancado. Quem publica é você: o site não mexe nas regras.
  - **Sem internet:** se o aparelho já entrou antes, confere com uma cópia do hash guardada nele e avisa. Aparelho novo sem internet não consegue criar nem conferir (mostra "Sem conexão" e o botão Tentar de novo).
  - **Sem Firebase configurado** (`window.FIREBASE_CONFIG = null`): a senha vale só naquele navegador.
  - **Esqueci a senha / quero trocar:** não há recuperação pelo site. No Console do Firebase, Firestore Database > coleção `acesso` > apague o documento `senha`. No próximo acesso o site pede para criar uma nova (aparelhos que já estão logados continuam até vencer as 24 h).
  - **Limites:** é só uma trava. Quem lê o Firestore enxerga o hash (senha fraca se descobre por tentativa), quem usa as ferramentas do navegador consegue passar, e os registros no Firebase continuam sem proteção.
  - Se o navegador não permitir guardar dados (modo privado, por exemplo), o site abre sem senha, porque não há onde guardar a sessão.

## Anotações (por registro)

Cada linha tem, na coluna **Ações**, o botão **Anotações** (com um número quando já existem anotações daquele Nome). Ele abre a janela "Anotações de {Nome}": só texto (até 1000 letras, com quebras de linha).

- **Escrever:** digite e toque em **Salvar anotação**. A mais nova fica em cima, com data e hora.
- **Buscar:** aparece quando há mais de uma anotação; acha uma palavra (sem acento e sem maiúscula).
- **Editar / Excluir:** em cada anotação. Editar marca "editada"; Excluir pede confirmação.
- **Excluir o registro leva as anotações dele**; se você clicar em **Desfazer**, elas voltam junto. A confirmação de excluir avisa quando há anotações.
- **Ficam só neste aparelho** (localStorage, chave `registros:anotacoes:v2`): **não vão para o Firebase**, então celular e computador têm anotações separadas. Máximo de 300. As anotações antigas "por projeto" (versão anterior) **não foram migradas**: continuam guardadas no navegador, mas não aparecem.
