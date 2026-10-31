/*
 * atualizar.js — avisa quando o site publicado tem uma versão mais nova que a aberta no aparelho
 * e deixa atualizar com um toque, sem desinstalar o app.
 *
 * Como funciona: versao.js guarda o número da versão. Aqui o site busca esse arquivo de novo
 * (ignorando qualquer cópia guardada) ao abrir, a cada 5 minutos e quando você volta para o app.
 * Se o número publicado for diferente do que está rodando, aparece o aviso "Há uma versão nova".
 */
(function () {
  'use strict';
  const atual = window.REGISTROS_VERSAO || '';
  const aviso = document.getElementById('aviso-versao');
  const botaoAviso = document.getElementById('aviso-versao-atualizar');
  const rotulo = document.getElementById('versao-texto');
  const botaoVerificar = document.getElementById('versao-verificar');
  const resposta = document.getElementById('versao-resposta');
  if (!atual || !aviso) return;
  if (rotulo) rotulo.textContent = atual;
  // Aberto direto do computador (arquivo), não há servidor para consultar.
  if (!/^https?:$/.test(window.location.protocol)) { if (botaoVerificar) botaoVerificar.hidden = true; return; }

  let mensagemTimer = null;
  function dizer(texto) {
    if (!resposta) return;
    resposta.textContent = texto;
    clearTimeout(mensagemTimer);
    if (texto) mensagemTimer = setTimeout(function () { resposta.textContent = ''; }, 6000);
  }

  function buscarPublicada() {
    return fetch('js/versao.js?_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.text(); })
      .then(function (t) {
        const m = /REGISTROS_VERSAO\s*=\s*'([^']+)'/.exec(t);
        if (!m) throw new Error('formato');
        return m[1];
      });
  }

  // Pede ao service worker para conferir também e recarrega; o sw.js busca tudo da rede.
  function atualizarAgora() {
    const recarregar = function () { window.location.reload(); };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(function (r) { return r ? r.update() : null; }).then(recarregar, recarregar);
    } else recarregar();
  }

  function verificar(manual) {
    return buscarPublicada().then(function (publicada) {
      if (publicada !== atual) {
        aviso.hidden = false;
        if (manual) dizer('Há uma versão nova (' + publicada + ').');
      } else if (manual) {
        dizer('Você já está na versão mais nova.');
      }
    }, function () {
      if (manual) dizer('Não foi possível verificar agora. Confira a internet.');
    });
  }

  botaoAviso.addEventListener('click', atualizarAgora);
  if (botaoVerificar) {
    botaoVerificar.addEventListener('click', function () {
      dizer('Verificando…');
      verificar(true);
    });
  }

  setTimeout(function () { verificar(false); }, 4000);
  setInterval(function () { if (!document.hidden) verificar(false); }, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) verificar(false); });
})();
