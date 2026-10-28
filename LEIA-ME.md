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
- **Editar:** clique em Editar na linha. `Enter` salva, `Esc` cancela. Dá para editar a qualquer momento.
- **Histórico:** botão **Histórico** no topo abre uma janela com tudo que aconteceu: criado, editado (mostra o que mudou, ex.: `Horário: 19:00 → 20:00`), excluído e horário atingido. Filtros por **tipo**, **período** (hoje, 7 ou 30 dias) e **busca** por nome ou pelo que mudou. `Esc`, o X ou clicar fora fecham. "Limpar histórico" apaga só o histórico, nunca os registros.
- **Excluir:** clique em Excluir. Um aviso aparece por 7 segundos com o botão Desfazer.
- **Verde:** quando o relógio do seu dispositivo chega ao horário do registro, a linha fica verde e aparece "Atingido". O texto do Estado nunca é alterado pela cor.
- **Sem horário:** a linha nunca fica verde. Uma data sozinha (sem horário) só é exibida, não destaca.
- **Com data:** fica verde a partir daquele dia e hora e **continua verde** depois, até você editar.
- **Sem data:** o horário vale todo dia (verde a partir de HH:MM, volta ao normal à meia-noite).

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

- **Histórico é por aparelho:** fica só no navegador de cada aparelho (máx. 500 entradas, as mais antigas saem) e **não sincroniza** pela nuvem. Registra o que você faz neste aparelho, não o que foi feito em outro. "Horário atingido" só é anotado com a página aberta no momento em que o horário chega. Desfazer uma exclusão remove a entrada dela.
- **Onde os dados ficam:** com a nuvem ligada, no Firestore (e uma cópia no aparelho, que funciona sem internet). Sem a nuvem (`firebase-config.js` com `null`), só no navegador (`localStorage`) e outro aparelho não enxerga nada.
- **Horário sem data:** fica verde a partir daquela hora e **volta ao normal à meia-noite**, valendo de novo no dia seguinte. Se quiser que fique verde e permaneça, preencha a data.
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

**Resultado esperado:** no final, `# pass 47` e `# fail 0`.

**Erros comuns:**
- `node não é reconhecido` / `command not found`: o Node.js não está instalado, ou o terminal foi aberto antes da instalação. Instale e abra um terminal novo.
- `Cannot find module './logica.js'`: o terminal está na pasta errada. Confira com `dir` (Windows) ou `ls` (Mac/Linux): `logica.js` deve aparecer na lista.
- `# fail` maior que 0: você alterou `logica.js`. O nome do teste que falhou aparece na saída e diz qual regra quebrou.
