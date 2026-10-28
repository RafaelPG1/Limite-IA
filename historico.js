/*
 * historico.js — regras do histórico (sem tela, para poder testar).
 *
 * Cada entrada: { t: milissegundos, tipo, id, nome, mudancas }
 *   tipo: 'criado' | 'editado' | 'excluido' | 'atingido'
 *   mudancas: só em 'editado' — lista de { campo, de, para }
 *
 * O histórico fica só neste aparelho (localStorage), com no máximo 500 entradas;
 * as mais antigas saem primeiro. A lista é guardada da mais nova para a mais antiga.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Historico = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CHAVE = 'registros:historico:v1';
  var MAXIMO = 500;
  var TIPOS = ['criado', 'editado', 'excluido', 'atingido'];
  var CAMPOS = ['nome', 'projeto', 'horario', 'data', 'estado', 'obs'];
  var ROTULO_CAMPO = { nome: 'Nome', projeto: 'Projeto', horario: 'Horário', data: 'Data', estado: 'Estado', obs: 'Observações' };

  function texto(v) { return typeof v === 'string' ? v : ''; }

  function sanearEntrada(e) {
    if (!e || typeof e !== 'object' || TIPOS.indexOf(e.tipo) === -1) return null;
    if (typeof e.t !== 'number' || !isFinite(e.t)) return null;
    var mudancas = Array.isArray(e.mudancas) ? e.mudancas.filter(function (m) {
      return m && CAMPOS.indexOf(m.campo) !== -1;
    }).map(function (m) { return { campo: m.campo, de: texto(m.de), para: texto(m.para) }; }) : [];
    return { t: e.t, tipo: e.tipo, id: texto(e.id), nome: texto(e.nome).slice(0, 80), mudancas: mudancas };
  }

  function sanear(lista) {
    if (!Array.isArray(lista)) return [];
    return lista.map(sanearEntrada).filter(Boolean).sort(function (a, b) { return b.t - a.t; }).slice(0, MAXIMO);
  }

  function carregar(armazenamento) {
    try { return sanear(JSON.parse(armazenamento.getItem(CHAVE))); } catch (e) { return []; }
  }

  function salvar(armazenamento, lista) {
    try { armazenamento.setItem(CHAVE, JSON.stringify(lista)); return true; } catch (e) { return false; }
  }

  // Devolve uma lista nova com a entrada no começo (a mais nova primeiro).
  function adicionar(lista, entrada) {
    var e = sanearEntrada(entrada);
    if (!e) return lista;
    return [e].concat(lista).slice(0, MAXIMO);
  }

  // O que mudou entre duas versões de um registro.
  function diferencas(antigo, novo) {
    return CAMPOS.filter(function (c) { return texto(antigo && antigo[c]) !== texto(novo && novo[c]); })
      .map(function (c) { return { campo: c, de: texto(antigo[c]), para: texto(novo[c]) }; });
  }

  function semAcento(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function inicioDoDia(agora) { return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime(); }

  // filtros: { tipo: 'todos'|tipo, periodo: 'tudo'|'hoje'|'7d'|'30d', texto: '' }
  function filtrar(lista, filtros, agora) {
    var f = filtros || {};
    var desde = 0;
    if (f.periodo === 'hoje') desde = inicioDoDia(agora);
    else if (f.periodo === '7d') desde = inicioDoDia(agora) - 6 * 86400000;
    else if (f.periodo === '30d') desde = inicioDoDia(agora) - 29 * 86400000;
    var busca = semAcento((f.texto || '').trim());
    return lista.filter(function (e) {
      if (f.tipo && f.tipo !== 'todos' && e.tipo !== f.tipo) return false;
      if (e.t < desde) return false;
      if (!busca) return true;
      var palheiro = e.nome + ' ' + e.mudancas.map(function (m) { return ROTULO_CAMPO[m.campo] + ' ' + m.de + ' ' + m.para; }).join(' ');
      return semAcento(palheiro).indexOf(busca) !== -1;
    });
  }

  return { CHAVE: CHAVE, MAXIMO: MAXIMO, TIPOS: TIPOS, ROTULO_CAMPO: ROTULO_CAMPO,
    sanear: sanear, carregar: carregar, salvar: salvar, adicionar: adicionar, diferencas: diferencas, filtrar: filtrar };
});
