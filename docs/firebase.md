# Firebase

O celular não abre arquivo do seu computador, então são dois passos: **publicar as regras** e **colocar a pasta num endereço na internet**.

## 1. Banco e regras (você faz no console; eu não publiquei nada)

1. [console.firebase.google.com](https://console.firebase.google.com) > projeto `limite-tempo` > **Firestore Database**. Se ainda não existir, clique em *Criar banco de dados*, modo **produção**, região `southamerica-east1` (São Paulo).
2. Aba **Regras**. Apague o que estiver lá, cole o conteúdo de `firebase/firestore.rules` e clique em **Publicar**.
3. Opcional: em *Regras > Playground de regras*, simule uma gravação em `/registros/teste` para conferir.

## 2. Colocar o site no ar

Envie **todo o conteúdo da pasta** (veja `docs/publicar.md`).

- **Cloudflare Pages (mais simples):** dash.cloudflare.com > Workers & Pages > Create > Pages > *Upload assets*. Arraste a pasta e publique. Você recebe um endereço `algo.pages.dev`.
- **GitHub Pages:** suba os arquivos num repositório seu e ative Pages nas configurações.

Abra o endereço no computador e no celular. Um registro criado num aparece no outro em poucos segundos.

## Avisos do canto superior

- **Conectando / Sincronizado:** normal.
- **Enviando:** gravação esperando confirmação do servidor.
- **Sem conexão:** funciona e guarda; envia quando a internet voltar. Se a internet está boa e o aviso não some, quase sempre é **extensão bloqueando o Firebase** (bloqueador de anúncios, Brave Shields, privacidade). Teste numa janela anônima sem extensões ou desative a extensão neste site; no console aparece `ERR_BLOCKED_BY_CLIENT`.
- **Erro de permissão:** as regras não foram publicadas, ou rejeitaram o registro.
- **Nuvem indisponível:** o Firebase não carregou; o site segue só neste aparelho.

## Segurança: leia

Sem login, **quem descobrir o endereço do site consegue ler e apagar os registros**. Não guarde nada sensível.

A chave em `js/firebase-config.js` é pública por natureza do Firebase; não coloque senhas ou tokens ali. As regras não foram testadas contra o Firebase real.

## Senha de acesso

- **Senha de acesso (trava simples, não é segurança):**
  - **Uma senha só, para todos os aparelhos.** Ela fica no Firestore, no documento `acesso/senha`, e **não** como texto: o site guarda só `sal` e `hash` (PBKDF2-SHA-256), então o que aparece no console do Firebase são letras e números sem sentido, nunca a senha.
  - **O site só LÊ a senha** (um `get` do documento) e confere o que você digitou. Ele nunca cria, troca nem apaga esse documento, e as regras do Firestore também bloqueiam qualquer escrita nele. Se o documento não existir, o site mostra "Não há senha cadastrada no Firebase" e não deixa criar.
  - Você fica **logado por 24 horas** neste aparelho, contadas do login (não renova sozinho). Passado isso, ou ao clicar em **Sair**, a senha é pedida de novo. O site aberto tranca sozinho quando vencer.
  - **IMPORTANTE, faça uma vez antes de usar:** publique o `firebase/firestore.rules` novo (Console do Firebase > Firestore Database > aba Regras > cole o arquivo inteiro > Publicar). Enquanto as regras antigas estiverem lá, o site mostra "O Firebase ainda não aceita a senha" e fica trancado. Quem publica é você: o site não mexe nas regras.
  - **Sem internet:** se o aparelho já entrou antes, confere com uma cópia do hash guardada nele e avisa. Aparelho novo sem internet não consegue conferir (mostra "Sem conexão" e o botão Tentar de novo).
  - **Sem Firebase configurado** (`window.FIREBASE_CONFIG = null`): a senha vale só naquele navegador.
  - **Cadastrar ou trocar a senha:** só pelo Console do Firebase (Firestore Database > coleção `acesso` > documento `senha`, com os campos de texto `sal` e `hash`). O site não faz isso.
  - **Limites:** é só uma trava. Quem lê o Firestore enxerga o hash (senha fraca se descobre por tentativa), quem usa as ferramentas do navegador consegue passar, e os registros no Firebase continuam sem proteção.
  - Se o navegador não permitir guardar dados (modo privado, por exemplo), o site abre sem senha, porque não há onde guardar a sessão.

## Anotações na nuvem

- Cada anotação é um documento em `anotacoes/{id}` com **4 campos**: `registroId` (texto), `texto` (texto, de 1 a 200 000 letras), `t` (número, quando foi criada) e `editada` (número). Nada além disso é aceito pelas regras.
- **Publique o `firebase/firestore.rules` novo** antes de abrir a versão nova do site. Sem isso o site mostra "O banco bloqueou o acesso" e as anotações continuam salvas só no aparelho (nada se perde).
- As regras também: não deixam **listar** a coleção `acesso` (só ler o documento `senha`), não deixam mudar `registroId` nem `t` de uma anotação existente e continuam bloqueando qualquer escrita em `acesso`.
- **Limite honesto das regras:** sem login, qualquer pessoa que tenha o endereço do site e a configuração pública do Firebase consegue **ler e apagar** anotações e registros. As regras só impedem dados fora do formato. Para proteger a leitura de verdade seria preciso login (Firebase Authentication), que ainda não existe. **Não cole tokens, senhas ou chaves nas anotações.**
