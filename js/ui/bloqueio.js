/*
 * bloqueio.js — tela de senha (usa as regras de senha.js).
 * Sem sessão válida (ou depois de 24 h), cobre a página com a tela de senha e a deixa inacessível.
 * Com o Firebase ligado, a senha é uma só, guardada no Firestore (/acesso/senha, só o hash);
 * sem Firebase, vale só neste navegador. É só uma trava simples; veja o aviso no topo de senha.js.
 */
(function () {
  'use strict';
  const S = window.RegistrosSenha;
  const raiz = document.documentElement;
  let arm = null;
  try { arm = window.localStorage; arm.getItem('registros:teste'); } catch (e) { arm = null; }
  // Sem as regras ou sem onde guardar a sessão, não há como trancar: deixa o site aberto.
  if (!S || !arm) { raiz.classList.remove('bloqueado'); return; }

  const tela = document.getElementById('tela-senha');
  const pagina = document.querySelector('.pagina');
  const form = document.getElementById('form-senha');
  const titulo = document.getElementById('senha-titulo');
  const texto = document.getElementById('senha-texto');
  const campo1 = document.getElementById('senha-1');
  const campo2 = document.getElementById('senha-2');
  const bloco1 = campo1.closest('.campo');
  const bloco2 = document.getElementById('senha-bloco-2');
  const erro = document.getElementById('senha-erro');
  const enviar = document.getElementById('senha-enviar');
  const botaoSair = document.getElementById('sair');

  const MENSAGEM = {
    curta: 'A senha precisa ter pelo menos ' + S.MINIMO + ' caracteres.',
    diferente: 'As duas senhas não são iguais.',
    errada: 'Senha incorreta.',
    'ja-existe': 'Alguém já criou a senha. Digite-a para entrar.',
    'sem-armazenamento': 'Não foi possível guardar a sessão neste navegador.',
    rede: 'Sem conexão com o Firebase. Conecte-se à internet e tente de novo.',
    regras: 'O Firebase ainda não aceita a senha. Publique o arquivo firestore.rules novo (passo a passo no LEIA-ME).',
  };

  // modo: '' (destrancado) | 'carregando' | 'entrar' | 'criar' | 'erro'
  let modo = '';
  let aberto = false;      // a página já foi destrancada
  let nuvem = null;        // { ler, criar } ou null (sem Firebase)
  let contaNuvem = null;   // conta lida do Firestore (ou do cache, sem conexão)
  let tentativa = 0;       // descarta respostas de conferências antigas

  function mostrarErro(codigo) {
    erro.textContent = MENSAGEM[codigo] || 'Algo deu errado.';
    erro.hidden = false;
  }

  function desenhar(texto1, opcoes) {
    const o = opcoes || {};
    titulo.textContent = o.titulo || 'Registros';
    texto.textContent = texto1;
    bloco1.hidden = !!o.semCampos;
    bloco2.hidden = !o.repetir;
    campo1.autocomplete = o.repetir ? 'new-password' : 'current-password';
    enviar.textContent = o.botao || 'Entrar';
    enviar.hidden = !!o.semBotao;
    enviar.disabled = false;
  }

  function fecharJanelas() {
    Array.prototype.forEach.call(document.querySelectorAll('dialog[open]'), function (d) { try { d.close(); } catch (e) { d.removeAttribute('open'); } });
  }

  function decidirModo() {
    const minha = ++tentativa;
    modo = 'carregando';
    erro.hidden = true;
    desenhar('Conferindo a senha…', { semCampos: true, semBotao: true });
    const pronta = window.RegistrosSenhaNuvem || Promise.resolve(null);
    pronta.then(function (n) {
      if (minha !== tentativa) return;
      nuvem = n;
      if (!n) { // sem Firebase: senha só deste navegador
        mostrar(S.existeConta(arm) ? 'entrar' : 'criar');
        return;
      }
      return n.ler().then(function (res) {
        if (minha !== tentativa) return;
        const c = S.contaValida(res && res.conta);
        if (c) { contaNuvem = c; S.guardarConta(arm, c); mostrar('entrar'); }
        else if (res && res.conta) { mostrar('erro', 'rede'); } // documento estranho: não deixa criar por cima
        else { contaNuvem = null; S.limparConta(arm); mostrar('criar'); }
      }, function (e) {
        if (minha !== tentativa) return;
        if (S.existeConta(arm)) { // sem conexão: usa a cópia guardada neste aparelho
          contaNuvem = null;
          mostrar('entrar', '', 'Sem conexão: conferindo com a senha guardada neste aparelho.');
        } else {
          mostrar('erro', e && e.code === 'permission-denied' ? 'regras' : 'rede');
        }
      });
    });
  }

  function mostrar(novo, codigoErro, aviso) {
    modo = novo;
    fecharJanelas();
    raiz.classList.add('bloqueado');
    if (pagina) pagina.inert = true;
    form.reset();
    erro.hidden = true;
    if (novo === 'criar') {
      desenhar('Escolha a senha deste site. Vale para todos os aparelhos e só dá para criar uma vez, então anote. Mínimo de ' + S.MINIMO + ' caracteres.',
        { titulo: 'Criar senha', repetir: true, botao: 'Criar senha e entrar' });
    } else if (novo === 'entrar') {
      desenhar(aviso || 'Digite a senha para entrar.');
    } else {
      desenhar('Não foi possível conferir a senha agora.', { semCampos: true, botao: 'Tentar de novo' });
      mostrarErro(codigoErro);
    }
    tela.hidden = false;
    if (novo !== 'erro') campo1.focus();
  }

  function trancar() {
    if (modo === 'carregando' || modo === 'entrar' || modo === 'criar') return;
    decidirModo(); // inclui tentar de novo quando estava em 'erro'
  }

  function destrancar() {
    tentativa++;
    modo = '';
    aberto = true;
    tela.hidden = true;
    raiz.classList.remove('bloqueado');
    if (pagina) pagina.inert = false;
    form.reset();
  }

  function atualizar() {
    if (S.sessaoValida(arm, new Date())) { if (modo || !aberto) destrancar(); } else trancar();
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (enviar.disabled || modo === 'carregando') return;
    if (modo === 'erro') { decidirModo(); return; }
    erro.hidden = true;
    const agora = new Date();
    const criando = modo === 'criar';
    const pedido = criando
      ? S.criar(arm, campo1.value, campo2.value, agora, nuvem ? nuvem.criar : null)
      : S.entrar(arm, campo1.value, agora, contaNuvem);
    enviar.disabled = true;
    pedido.then(function (res) {
      if (res.ok) { destrancar(); return; }
      if (res.erro === 'ja-existe') { decidirModo(); setTimeout(function () { if (modo === 'entrar') mostrarErro('ja-existe'); }, 600); return; }
      mostrarErro(res.erro);
      campo1.value = '';
      campo2.value = '';
      campo1.focus();
      // Senha errada: espera um pouco antes de deixar tentar de novo.
      setTimeout(function () { enviar.disabled = false; }, res.erro === 'errada' ? 1500 : 0);
    });
  });

  if (botaoSair) botaoSair.addEventListener('click', function () { S.sair(arm); atualizar(); });

  // Passou das 24 h, outra aba entrou ou saiu, ou a aba voltou a ser vista: confere de novo.
  setInterval(atualizar, 15000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) atualizar(); });
  window.addEventListener('pageshow', function () { if (aberto) atualizar(); });
  window.addEventListener('storage', function (ev) {
    if (ev.key === S.CHAVE_SESSAO || ev.key === null) atualizar();
  });

  // O nuvem.js (que entrega a senha única) carrega depois deste arquivo: espera a página toda.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', atualizar);
  else atualizar();
})();
