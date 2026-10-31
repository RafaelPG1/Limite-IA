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
  - No primeiro acesso (quando o documento ainda não existe) o site pede para **criar a senha** (mínimo de 4 caracteres, digitada duas vezes). Depois disso, em qualquer aparelho, a tela só pede a senha. As regras do Firestore **não deixam criar de novo, trocar nem apagar** o documento.
  - Você fica **logado por 24 horas** neste aparelho, contadas do login (não renova sozinho). Passado isso, ou ao clicar em **Sair**, a senha é pedida de novo. O site aberto tranca sozinho quando vencer.
  - **IMPORTANTE, faça uma vez antes de usar:** publique o `firebase/firestore.rules` novo (Console do Firebase > Firestore Database > aba Regras > cole o arquivo inteiro > Publicar). Enquanto as regras antigas estiverem lá, o site mostra "O Firebase ainda não aceita a senha" e fica trancado. Quem publica é você: o site não mexe nas regras.
  - **Sem internet:** se o aparelho já entrou antes, confere com uma cópia do hash guardada nele e avisa. Aparelho novo sem internet não consegue criar nem conferir (mostra "Sem conexão" e o botão Tentar de novo).
  - **Sem Firebase configurado** (`window.FIREBASE_CONFIG = null`): a senha vale só naquele navegador.
  - **Esqueci a senha / quero trocar:** não há recuperação pelo site. No Console do Firebase, Firestore Database > coleção `acesso` > apague o documento `senha`. No próximo acesso o site pede para criar uma nova (aparelhos que já estão logados continuam até vencer as 24 h).
  - **Limites:** é só uma trava. Quem lê o Firestore enxerga o hash (senha fraca se descobre por tentativa), quem usa as ferramentas do navegador consegue passar, e os registros no Firebase continuam sem proteção.
  - Se o navegador não permitir guardar dados (modo privado, por exemplo), o site abre sem senha, porque não há onde guardar a sessão.
