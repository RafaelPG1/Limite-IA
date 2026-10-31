# App instalável

O site pode ser instalado como app, com ícone próprio e janela sem barra de endereço (no Android, na tela inicial).

- **Precisa de um endereço https** (o site já publicado). Abrindo o arquivo `index.html` direto do computador **não** instala.
- **Android (Chrome):** abra o site > menu ⋮ > **Instalar app** (ou "Adicionar à tela inicial"). Pode aparecer sozinho um aviso "Instalar".
- **Computador (Chrome ou Edge):** ícone de instalar no canto direito da barra de endereço, ou menu > **Instalar Registros**.
- **Não guarda cache.** O `sw.js` é mínimo de propósito: não salva nenhuma página nem arquivo, então o app instalado sempre carrega a versão mais nova do site (não repete o problema de ficar preso numa versão antiga). O preço é que **sem internet o app não abre**.
- A senha e a sessão de 24 h continuam valendo no app (o app pode ter armazenamento separado do Chrome comum e pedir a senha uma vez).
- **Se aparecer "Não é possível instalar o app":** abra `instalar.html` no endereço do seu site (o mesmo do `index.html`, trocando o final). Ela confere, no seu aparelho, endereço https, manifesto, ícones e service worker, mostra ✓ ou ✗ para cada um e tem o botão **Instalar agora** quando o Chrome libera. Confira também que **todos** os arquivos novos foram enviados ao site (`manifest.webmanifest`, `sw.js`, `assets/icons/icone-192.png`, `assets/icons/icone-512.png`, `assets/icons/icone-512-maskable.png`). Se já instalou antes, desinstale o app antigo e limpe os dados do site no Chrome.
- **Tela cheia (ligada):** o `manifest.webmanifest` usa `"display": "fullscreen"`, então o app instalado ocupa a tela **100%**, sem a barra de notificações e sem a de navegação (o relógio do site continua aparecendo no topo). Para ver as barras do Android por um instante, deslize da borda de cima ou de baixo. Se algum celular não suportar, o app cai sozinho para o modo normal (`standalone`). O site também desvia de recortes de tela (`viewport-fit=cover`). **Para mudar o modo no app já instalado é preciso desinstalar e instalar de novo.** Para voltar ao modo com as barras, troque `fullscreen` por `standalone` no manifesto (e em `display_override`), publique e reinstale.
- **Cores:** `theme_color` e `background_color` do manifesto (e `theme-color` no `index.html`) usam a cor do fundo do site, clara ou escura.
- Depois de atualizar os arquivos no site, feche e abra o app para pegar a versão nova.

## Atualizar o app sem reinstalar

- **Reinstalar só é preciso quando muda o manifesto** (modo de tela cheia, ícones, cores, nome). Para tudo o resto (telas, regras, botões novos), basta **publicar os arquivos no site**.
- O app instalado abre o site pela internet e o `sw.js` confere com o servidor a cada arquivo, ignorando a cópia velha do navegador (o GitHub Pages deixa arquivos em cache por uns 10 minutos). Nada é guardado no aparelho.
- **Aviso automático:** o site compara o número em `js/versao.js` com o publicado, ao abrir, a cada 5 minutos e quando você volta para o app. Se houver versão nova, aparece **"Há uma versão nova do site. [Atualizar]"** no topo. Tocar em Atualizar recarrega já na versão nova.
- **Manual:** no rodapé da página aparece a **Versão** e o botão **Verificar atualização**.
- **Publicando:** envie **todos** os arquivos do zip, incluindo o `js/versao.js` (cada entrega nova vem com um número novo). Se enviar os arquivos mas esquecer o `js/versao.js`, o app só atualiza ao ser aberto de novo, sem o aviso.
- **Abrindo o arquivo direto do computador** (sem site): não há o que verificar; o botão some.
