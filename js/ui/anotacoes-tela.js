/*
 * anotacoes-tela.js — janela "Anotações" de UM registro (usa as regras de anotacoes.js).
 * Abre pelo botão "Anotações" da coluna Ações de cada linha. Só texto. Guarda neste aparelho (localStorage) e, com o Firebase ligado, sincroniza com a coleção "anotacoes".
 * Para o app.js oferece: abrir(id, nome, origem), contar(id), tirar(id) → notas, devolver(notas).
 * Avisa a página com o evento 'registros:notas' sempre que algo muda.
 */
(function () {
  'use strict';
  const N = window.RegistrosAnotacoes;
  const dlg = document.getElementById('anotacoes');
  if (!N || !dlg) return;

  let arm = null;
  try { arm = window.localStorage; } catch (e) { arm = null; }

  const el = {
    titulo: document.getElementById('not-titulo'),
    fechar: document.getElementById('not-fechar'),
    form: document.getElementById('not-form'),
    texto: document.getElementById('not-texto'),
    contador: document.getElementById('not-contador'),
    erro: document.getElementById('not-erro'),
    salvar: document.getElementById('not-salvar'),
    cancelarEdicao: document.getElementById('not-cancelar-edicao'),
    fTexto: document.getElementById('not-f-texto'),
    contagem: document.getElementById('not-contagem'),
    lista: document.getElementById('not-lista'),
    vazio: document.getElementById('not-vazio'),
    conf: document.getElementById('confirmar-nota'),
    confTexto: document.getElementById('cn-texto'),
    confCancelar: document.getElementById('cn-cancelar'),
    confConfirmar: document.getElementById('cn-confirmar'),
  };

  let notas = arm ? N.carregar(arm) : [];
  let registroId = null;
  let registroNome = '';
  let origem = null;
  let editandoId = null;

  const MENSAGEM = {
    'texto-vazio': 'Escreva a anotação.',
    'texto-longo': 'A anotação passou de ' + N.MAX_TEXTO.toLocaleString('pt-BR') + ' letras (limite do banco). Divida em duas anotações.',
    'sem-espaco': 'Não coube no armazenamento deste aparelho (cerca de 5 MB no total). Apague anotações antigas ou divida o texto. O que você escreveu continua aqui.',
    'nao-encontrada': 'Essa anotação não existe mais.',
    'registro-vazio': 'Abra as anotações pelo botão da linha.',
  };

  function criar(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }
  const dois = function (n) { return String(n).padStart(2, '0'); };
  function quando(t) {
    const d = new Date(t);
    return dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + '/' + d.getFullYear() + ', ' + dois(d.getHours()) + ':' + dois(d.getMinutes());
  }
  function abrirDialogo(d) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
  function fecharDialogo(d) { if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); }

  function avisar() { window.dispatchEvent(new CustomEvent('registros:notas')); }
  // ---- Nuvem (opcional): a nuvem é a fonte da verdade; este aparelho guarda uma cópia.
  const CHAVE_MIGRADO = 'registros:anotacoes:nuvem:v1';
  let nuvemN = null;
  let ultima = notas;      // o que já foi mandado à nuvem
  function erroNuvem(e) { if (window.RegistrosApp) window.RegistrosApp.nuvemErro(e && e.code); }
  function mandar(antes, depois) {
    if (!nuvemN) return Promise.resolve();
    const velhas = {}, novas = {}, tarefas = [];
    antes.forEach(function (a) { velhas[a.id] = a; });
    depois.forEach(function (a) {
      novas[a.id] = true;
      const o = velhas[a.id];
      if (!o || o.texto !== a.texto || o.editada !== a.editada || o.t !== a.t || o.registroId !== a.registroId) tarefas.push(nuvemN.gravar(a));
    });
    antes.forEach(function (a) { if (!novas[a.id]) tarefas.push(nuvemN.apagar(a.id)); });
    return Promise.all(tarefas).catch(erroNuvem);
  }
  function persistir() {
    const ok = arm ? N.salvar(arm, notas) : true;
    if (ok) { const antes = ultima; ultima = notas; mandar(antes, notas); }
    avisar();
    return ok;
  }
  function migrado() { try { return !!arm && arm.getItem(CHAVE_MIGRADO) === '1'; } catch (e) { return false; } }
  function receber(lista, meta) {
    if (meta && meta.doCache) return; // espera o servidor: a cópia do aparelho pode estar vazia
    const daNuvem = N.sanear(lista);
    if (!migrado()) {
      // Primeira vez: sobe o que só existe neste aparelho (sem apagar nada) e depois passa a seguir a nuvem.
      const ids = {};
      daNuvem.forEach(function (a) { ids[a.id] = true; });
      const so = notas.filter(function (a) { return !ids[a.id]; });
      notas = N.sanear(daNuvem.concat(so));
      ultima = notas;
      if (arm) N.salvar(arm, notas);
      Promise.all(so.map(function (a) { return nuvemN.gravar(a); })).then(function () {
        try { if (arm) arm.setItem(CHAVE_MIGRADO, '1'); } catch (e) { /* sem ação */ }
      }, erroNuvem);
    } else {
      notas = daNuvem;
      ultima = notas;
      if (arm) N.salvar(arm, notas);
    }
    avisar();
    if (dlg.open) desenhar();
  }
  function conectar(adaptador) {
    nuvemN = adaptador;
    adaptador.observar(receber, function (codigo) { erroNuvem({ code: codigo }); nuvemN = null; });
  }

  function atualizarContador() {
    const n = el.texto.value.length;
    el.contador.textContent = n ? '(' + n.toLocaleString('pt-BR') + ' letras)' : '';
  }

  function desenhar() {
    const todas = N.doRegistro(notas, registroId);
    const filtrado = N.filtrar(notas, registroId, el.fTexto.value);
    el.lista.textContent = '';
    filtrado.forEach(function (n) {
      const li = criar('li', 'hist-item not-item');
      li.dataset.id = n.id;
      const topo = criar('div', 'not-topo');
      topo.appendChild(criar('span', 'not-quando', quando(n.t) + (n.editada ? ' · editada ' + quando(n.editada) : '')));
      li.appendChild(topo);
      const acoes = criar('div', 'not-acoes');
      const bCopiar = criar('button', 'botao botao-sutil not-botao', 'Copiar');
      bCopiar.type = 'button'; bCopiar.dataset.acao = 'copiar'; bCopiar.setAttribute('aria-label', 'Copiar a anotação inteira de ' + quando(n.t));
      const bEditar = criar('button', 'botao botao-sutil not-botao', 'Editar');
      bEditar.type = 'button'; bEditar.dataset.acao = 'editar'; bEditar.setAttribute('aria-label', 'Editar anotação de ' + quando(n.t));
      const bExcluir = criar('button', 'botao botao-sutil hist-apagar', 'Excluir');
      bExcluir.type = 'button'; bExcluir.dataset.acao = 'excluir'; bExcluir.setAttribute('aria-label', 'Excluir anotação de ' + quando(n.t));
      acoes.appendChild(bCopiar); acoes.appendChild(bEditar); acoes.appendChild(bExcluir);
      li.appendChild(acoes);
      li.appendChild(criar('p', 'not-texto', n.texto));
      el.lista.appendChild(li);
    });
    const filtrando = el.fTexto.value.trim();
    el.contagem.textContent = todas.length
      ? (filtrando ? filtrado.length + ' de ' + todas.length + ' anotações' : todas.length + (todas.length === 1 ? ' anotação' : ' anotações'))
      : '';
    el.vazio.hidden = filtrado.length > 0;
    el.vazio.textContent = todas.length ? 'Nenhuma anotação com essa busca.' : 'Nenhuma anotação ainda. Escreva acima e toque em Salvar anotação.';
    // A busca só faz sentido quando já existe algo para buscar.
    el.fTexto.closest('.campo').hidden = todas.length < 2 && !filtrando;
  }

  function sairDaEdicao() {
    editandoId = null;
    el.salvar.textContent = 'Salvar anotação';
    el.cancelarEdicao.hidden = true;
  }

  function mostrarErro(codigos) {
    el.erro.textContent = codigos.map(function (c) { return MENSAGEM[c] || 'Algo deu errado.'; }).join(' ');
    el.erro.hidden = false;
    el.texto.setAttribute('aria-invalid', 'true');
  }
  function limparErro() { el.erro.hidden = true; el.texto.removeAttribute('aria-invalid'); }

  el.form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    const dados = { registroId: registroId, texto: el.texto.value };
    const agora = new Date();
    const res = editandoId ? N.editar(notas, editandoId, dados, agora) : N.criar(notas, dados, agora);
    if (!res.ok) { mostrarErro(res.erros); return; }
    limparErro();
    const antes = notas;
    notas = res.lista;
    if (!persistir()) { notas = antes; if (arm) N.salvar(arm, notas); avisar(); mostrarErro(['sem-espaco']); return; }
    sairDaEdicao();
    el.texto.value = '';
    atualizarContador();
    desenhar();
    el.texto.focus();
  });

  el.cancelarEdicao.addEventListener('click', function () {
    sairDaEdicao(); limparErro();
    el.texto.value = ''; atualizarContador();
    el.texto.focus();
  });

  el.lista.addEventListener('click', function (ev) {
    const b = ev.target.closest('button[data-acao]');
    if (!b) return;
    const nota = notas.find(function (n) { return n.id === b.closest('li').dataset.id; });
    if (!nota) return;
    if (b.dataset.acao === 'copiar') {
      copiar(nota.texto).then(function (deu) {
        b.textContent = deu ? 'Copiado!' : 'Não copiou';
        setTimeout(function () { if (b.isConnected) b.textContent = 'Copiar'; }, 1800);
      });
    } else if (b.dataset.acao === 'editar') {
      editandoId = nota.id;
      el.texto.value = nota.texto;
      el.salvar.textContent = 'Salvar alterações';
      el.cancelarEdicao.hidden = false;
      limparErro(); atualizarContador();
      el.form.scrollIntoView({ block: 'nearest' });
      el.texto.focus();
    } else {
      pedirExclusao(nota);
    }
  });

  // Copia o texto inteiro (sem cortar nada). Usa a área de transferência do navegador; se ela
  // não estiver disponível (página sem HTTPS), cai num campo temporário.
  function copiar(texto) {
    function plano() {
      const t = document.createElement('textarea');
      t.value = texto; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(t); t.select();
      let deu = false;
      try { deu = document.execCommand('copy'); } catch (e) { deu = false; }
      t.remove();
      return deu;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return plano(); });
    }
    return Promise.resolve(plano());
  }

  function pedirExclusao(nota) {
    const resumo = nota.texto.length > 80 ? nota.texto.slice(0, 80) + '…' : nota.texto;
    el.confTexto.textContent = resumo;
    function fechar() { el.confCancelar.onclick = el.confConfirmar.onclick = el.conf.onclick = null; fecharDialogo(el.conf); }
    el.confCancelar.onclick = function () { fechar(); };
    el.conf.onclick = function (ev) { if (ev.target === el.conf) fechar(); };
    el.confConfirmar.onclick = function () {
      fechar();
      notas = N.remover(notas, nota.id);
      persistir();
      if (editandoId === nota.id) { sairDaEdicao(); el.texto.value = ''; atualizarContador(); }
      desenhar();
    };
    abrirDialogo(el.conf);
    el.confConfirmar.focus(); // Enter confirma a exclusão
  }

  el.fTexto.addEventListener('input', desenhar);
  el.texto.addEventListener('input', atualizarContador);

  function abrir(id, nome, deOnde) {
    if (!id) return;
    notas = arm ? N.carregar(arm) : notas; // pega o que outra aba tenha salvo
    registroId = id;
    registroNome = nome || '';
    origem = deOnde || null;
    el.titulo.textContent = 'Anotações de ' + (registroNome || 'registro');
    sairDaEdicao(); limparErro();
    el.texto.value = ''; el.fTexto.value = '';
    atualizarContador();
    desenhar();
    abrirDialogo(dlg);
    el.texto.focus();
  }

  function fecharJanela() {
    fecharDialogo(dlg);
    if (origem && origem.isConnected) origem.focus();
  }
  el.fechar.addEventListener('click', fecharJanela);
  dlg.addEventListener('click', function (ev) { if (ev.target === dlg) fecharJanela(); });
  // Esc também fecha: devolve o foco ao botão da linha.
  dlg.addEventListener('close', function () { if (origem && origem.isConnected) origem.focus(); });

  window.RegistrosAnotacoesTela = {
    conectar: conectar,
    abrir: abrir,
    contar: function (id) { return N.contar(notas, id); },
    // Excluir um registro leva as anotações dele; o app guarda a lista para o "Desfazer".
    tirar: function (id) {
      notas = arm ? N.carregar(arm) : notas;
      const r = N.removerDoRegistro(notas, id);
      if (r.removidas.length) { notas = r.lista; persistir(); }
      return r.removidas;
    },
    devolver: function (lista) {
      if (!lista || !lista.length) return;
      notas = arm ? N.carregar(arm) : notas;
      notas = N.devolver(notas, lista);
      persistir();
    },
  };
  avisar();
})();
