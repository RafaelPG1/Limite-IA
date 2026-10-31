# Publicar o site

O site é estático: basta enviar a pasta. **Mantenha a estrutura de pastas** (o `index.html` aponta para `css/`, `js/` e `assets/`).

**Envie:** `index.html`, `instalar.html`, `manifest.webmanifest`, `sw.js`, e as pastas `css/`, `js/`, `assets/`.
**Não precisa enviar:** `tests/`, `docs/`, `firebase/`, `package.json`, `README.md` (podem ficar no repositório sem problema; `firebase/firestore.rules` é para colar no console do Firebase).

**Importante ao migrar da estrutura antiga:** apague do repositório/site os arquivos que ficavam soltos na raiz (`app.js`, `logica.js`, `estilo.css`, `nuvem.js`, `senha.js`, `bloqueio.js`, `historico.js`, `anotacoes.js`, `anotacoes-tela.js`, `atualizar.js`, `versao.js`, `firebase-config.js`, `firestore.rules`, `icone*.png`, `icone*.svg`, `testes*.js`, `LEIA-ME.md`). Se ficarem, nada quebra, mas são cópias mortas que confundem.

Opções de hospedagem: Cloudflare Pages (upload da pasta) ou GitHub Pages (você sobe os arquivos e ativa Pages). Depois de publicar, o app abre o aviso "Há uma versão nova" sozinho (`js/versao.js`).
