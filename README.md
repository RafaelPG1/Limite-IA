# Registros

Tabela de registros em HTML, CSS e JavaScript puros (sem dependências, sem build). Cada registro tem **Nome** (obrigatório), **Projeto**, **Horário**, **Data**, **Estado** e **Observações**. Sincroniza computador e celular pelo Firestore, tem senha única de acesso, histórico, anotações por registro e pode ser instalado como app.

## Estrutura

```
registros/
├── index.html               página principal
├── instalar.html            diagnóstico de "Instalar app"
├── manifest.webmanifest     manifesto do app instalável
├── sw.js                    service worker (fica na raiz por causa do escopo)
├── package.json             comando `npm test`
├── css/
│   └── estilo.css           visual (cores no começo do arquivo)
├── js/
│   ├── versao.js            número da versão (aviso de atualização)
│   ├── firebase-config.js   configuração pública do projeto Firebase
│   ├── core/                regras puras, sem tela, testáveis no Node
│   │   ├── logica.js        validar, editar, ordenar, horário atingido
│   │   ├── historico.js     histórico por aparelho
│   │   ├── anotacoes.js     anotações por registro
│   │   └── senha.js         senha única (hash)
│   ├── ui/                  telas e eventos (usam o core)
│   │   ├── app.js           tabela, formulário, relógio
│   │   ├── anotacoes-tela.js janela de anotações
│   │   ├── bloqueio.js      tela de senha
│   │   └── atualizar.js     aviso de versão nova
│   └── nuvem/
│       └── nuvem.js         ligação com o Firestore
├── assets/icons/            ícones do site e do app
├── firebase/
│   └── firestore.rules      regras para colar no console do Firebase
├── tests/                   testes automáticos (`*.test.js`)
└── docs/                    documentação detalhada
```

Regra de organização: **`core/` não mexe na tela** (por isso é testável), **`ui/` não tem regra de negócio**, e só `nuvem/` fala com o Firebase.

## Como abrir

Dê dois cliques em `index.html`. Não precisa de servidor, internet nem instalação (a sincronização e o app instalável só funcionam com o site publicado, veja `docs/firebase.md` e `docs/app-instalavel.md`).

## Testes

Veja a seção abaixo, passo a passo.

## Documentação

| Arquivo | Assunto |
|---|---|
| `docs/uso.md` | Como usar cada recurso |
| `docs/regras-de-negocio.md` | Horário, data, estado, ordem, histórico, anotações |
| `docs/firebase.md` | Banco, regras, publicação, segurança, senha |
| `docs/app-instalavel.md` | Instalar como app e atualizar sem reinstalar |
| `docs/publicar.md` | Quais arquivos enviar ao site |

## Testes automáticos

**O que verificam:** cadastro, validação de horário e data, edição, exclusão e desfazer, ordenação, histórico, senha e anotações (96 testes).

**Ferramenta necessária:** Node.js 18 ou mais novo (nodejs.org). Confira com `node --version`.

**Onde abrir o terminal:** dentro da pasta `registros` (a que contém `package.json`).
- Windows: abra a pasta no Explorador, clique na barra de endereço, digite `cmd` e Enter.
- Mac/Linux: `cd caminho/para/registros`.

**Comando:**

```
npm test
```

(ou, sem npm: `node --test tests/logica.test.js tests/historico.test.js tests/senha.test.js tests/anotacoes.test.js`)

**Resultado esperado:** no final, `# pass 96` e `# fail 0`.

**Erros comuns:**
- `node`/`npm` não é reconhecido: Node.js não instalado, ou terminal aberto antes da instalação. Instale e abra um terminal novo.
- `Cannot find module '../js/core/logica.js'`: o terminal está na pasta errada. Rode `dir` (Windows) ou `ls` (Mac/Linux): `package.json` deve aparecer.
- `Could not read package.json`: mesma causa, pasta errada.
- `# fail` maior que 0: o nome do teste que falhou diz qual regra quebrou (você alterou algo em `js/core/`).

## Segurança e limites (resumo)

- A senha é só uma trava: quem lê o Firestore vê o hash, e os registros no Firebase continuam sem proteção. Não guarde nada sensível.
- Histórico e anotações ficam **só no aparelho** (localStorage) e não sincronizam.
- Nada deste projeto publica no GitHub ou altera o Firebase sozinho: você publica as regras e os arquivos.
