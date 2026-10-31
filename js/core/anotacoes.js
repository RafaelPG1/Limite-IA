/*
 * anotacoes.js — regras das anotações de cada registro (sem tela, para poder testar).
 *
 * Cada anotação: { id, registroId, texto, t, editada }
 *   registroId: id do registro (o "nome" da tabela) a que a anotação pertence
 *   texto:      a anotação, só texto (até 1000 letras; quebras de linha são mantidas)
 *   t:          quando foi criada (milissegundos); editada: quando foi alterada pela última vez (ou 0)
 *
 * Ficam só neste aparelho (localStorage), da mais nova para a mais antiga, no máximo 300 no total.
 * Não expiram sozinhas: só saem se você excluir a anotação ou o registro.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.RegistrosAnotacoes = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CHAVE = 'registros:anotacoes:v2';
  var MAX_TEXTO = 1000;
  var MAXIMO = 300;

  function semAcento(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function limparTexto(v) { return typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : ''; }

  function gerarId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Erros possíveis: 'registro-vazio', 'texto-vazio', 'texto-longo'.
  function erros(dados) {
    var d = dados || {};
    var e = [];
    if (typeof d.registroId !== 'string' || !d.registroId) e.push('registro-vazio');
    var t = limparTexto(d.texto);
    if (!t) e.push('texto-vazio'); else if (t.length > MAX_TEXTO) e.push('texto-longo');
    return e;
  }

  function criar(lista, dados, agora, novoId) {
    var e = erros(dados);
    if (e.length) return { ok: false, erros: e };
    var a = {
      id: (novoId || gerarId)(),
      registroId: dados.registroId,
      texto: limparTexto(dados.texto),
      t: (agora || new Date()).getTime(),
      editada: 0,
    };
    return { ok: true, anotacao: a, lista: [a].concat(lista).slice(0, MAXIMO) };
  }

  // Só o texto muda; o registro a que a anotação pertence não.
  function editar(lista, id, dados, agora) {
    var i = lista.findIndex(function (a) { return a.id === id; });
    if (i === -1) return { ok: false, erros: ['nao-encontrada'] };
    var antiga = lista[i];
    var e = erros({ registroId: antiga.registroId, texto: (dados || {}).texto });
    if (e.length) return { ok: false, erros: e };
    var texto = limparTexto(dados.texto);
    var nova = {
      id: antiga.id, registroId: antiga.registroId, texto: texto, t: antiga.t,
      editada: texto !== antiga.texto ? (agora || new Date()).getTime() : antiga.editada,
    };
    var copia = lista.slice();
    copia[i] = nova;
    return { ok: true, anotacao: nova, lista: copia };
  }

  function remover(lista, id) {
    var nova = lista.filter(function (a) { return a.id !== id; });
    return nova.length === lista.length ? lista : nova;
  }

  // Tira todas as anotações de um registro (ao excluí-lo). Devolve { lista, removidas }.
  function removerDoRegistro(lista, registroId) {
    var removidas = lista.filter(function (a) { return a.registroId === registroId; });
    return { lista: removidas.length ? lista.filter(function (a) { return a.registroId !== registroId; }) : lista, removidas: removidas };
  }

  // Devolve anotações tiradas (ao desfazer a exclusão do registro), sem repetir ids; respeita o limite.
  function devolver(lista, anotacoes) {
    var ids = {};
    lista.forEach(function (a) { ids[a.id] = true; });
    var novas = sanear(anotacoes).filter(function (a) { return !ids[a.id]; });
    return novas.length ? sanear(lista.concat(novas)) : lista;
  }

  function doRegistro(lista, registroId) {
    return lista.filter(function (a) { return a.registroId === registroId; });
  }

  function contar(lista, registroId) { return doRegistro(lista, registroId).length; }

  // Buscar: cada palavra digitada precisa aparecer no texto (sem acento e sem maiúscula).
  function filtrar(lista, registroId, texto) {
    var palavras = semAcento((texto || '').trim()).split(/\s+/).filter(Boolean);
    return doRegistro(lista, registroId).filter(function (a) {
      var palheiro = semAcento(a.texto);
      return palavras.every(function (w) { return palheiro.indexOf(w) !== -1; });
    });
  }

  function sanear(bruta) {
    if (!Array.isArray(bruta)) return [];
    var vistos = {};
    var saida = [];
    bruta.forEach(function (x) {
      if (!x || typeof x !== 'object') return;
      var texto = limparTexto(x.texto);
      if (typeof x.registroId !== 'string' || !x.registroId || !texto) return;
      var id = typeof x.id === 'string' && x.id ? x.id : gerarId();
      if (vistos[id]) id = gerarId();
      vistos[id] = true;
      saida.push({
        id: id,
        registroId: x.registroId,
        texto: texto.slice(0, MAX_TEXTO),
        t: typeof x.t === 'number' && isFinite(x.t) ? x.t : 0,
        editada: typeof x.editada === 'number' && isFinite(x.editada) ? x.editada : 0,
      });
    });
    saida.sort(function (a, b) { return b.t - a.t; });
    return saida.slice(0, MAXIMO);
  }

  function carregar(arm) {
    try { return sanear(JSON.parse(arm.getItem(CHAVE))); } catch (e) { return []; }
  }
  function salvar(arm, lista) {
    try { arm.setItem(CHAVE, JSON.stringify(lista)); return true; } catch (e) { return false; }
  }

  return {
    CHAVE: CHAVE, MAX_TEXTO: MAX_TEXTO, MAXIMO: MAXIMO,
    erros: erros, criar: criar, editar: editar, remover: remover, removerDoRegistro: removerDoRegistro,
    devolver: devolver, doRegistro: doRegistro, contar: contar, filtrar: filtrar,
    sanear: sanear, carregar: carregar, salvar: salvar,
  };
});
