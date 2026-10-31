/*
 * historico.js — regras do histórico (sem tela, para poder testar).
 *
 * Cada entrada: { t: milissegundos, tipo, id, nome, projeto, horario, data, estado, obs, mudancas }
 *   nome...obs: como o registro estava naquele momento (é o que a busca enxerga)
 *   tipo: 'criado' | 'editado' | 'excluido' | 'atingido'
 *   mudancas: só em 'editado' — lista de { campo, de, para }
 *
 * O histórico fica só neste aparelho (localStorage), com no máximo 500 entradas.
 * Cada entrada é apagada sozinha depois de 1 dia útil (segunda a sexta; sábado e
 * domingo não contam, feriados também não são considerados): criada na sexta às 15h,
 * vence na segunda às 15h. A lista é guardada da mais nova para a mais antiga.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Historico = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CHAVE = 'registros:historico:v1';
  var MAXIMO = 500;
  var DIAS_UTEIS = 1; // quanto tempo cada entrada vive
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
    return {
      t: e.t, tipo: e.tipo, id: texto(e.id),
      nome: texto(e.nome).slice(0, 80), projeto: texto(e.projeto).slice(0, 80),
      horario: texto(e.horario).slice(0, 5), data: texto(e.data).slice(0, 10),
      estado: texto(e.estado).slice(0, 80), obs: texto(e.obs).slice(0, 200),
      mudancas: mudancas,
    };
  }

  // Momento em que uma entrada criada em t deixa de valer: t + DIAS_UTEIS dias úteis.
  function venceEm(t) {
    var d = new Date(t);
    var falta = DIAS_UTEIS;
    while (falta > 0) {
      d.setDate(d.getDate() + 1);
      var dia = d.getDay(); // 0 domingo, 6 sábado
      if (dia !== 0 && dia !== 6) falta--;
    }
    return d.getTime();
  }

  // Tira as entradas vencidas. Devolve a mesma lista se nada venceu.
  function podar(lista, agora) {
    var limite = agora.getTime();
    var vivas = lista.filter(function (e) { return venceEm(e.t) > limite; });
    return vivas.length === lista.length ? lista : vivas;
  }

  function remover(lista, entrada) {
    return lista.filter(function (e) { return e !== entrada; });
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

  var ROTULO_TIPO = { criado: 'Criado', editado: 'Editado', excluido: 'Excluído', atingido: 'Horário atingido' };

  function dois(n) { return (n < 10 ? '0' : '') + n; }

  // "28/10/2026, 11:03"
  function quando(t) {
    var d = new Date(t);
    return dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + '/' + d.getFullYear() + ', ' + dois(d.getHours()) + ':' + dois(d.getMinutes());
  }

  // "2026-10-27" -> "27/10/2026 27/10" (assim "27/10" também acha)
  function dataParaBusca(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[3] + '/' + m[2] : (iso || '');
  }

  // Todo o texto que a busca livre enxerga numa entrada.
  function palheiro(e) {
    var partes = [ROTULO_TIPO[e.tipo], e.nome, e.projeto, e.horario, e.estado, e.obs, dataParaBusca(e.data), quando(e.t)];
    e.mudancas.forEach(function (m) {
      partes.push(ROTULO_CAMPO[m.campo], m.campo === 'data' ? dataParaBusca(m.de) : m.de, m.campo === 'data' ? dataParaBusca(m.para) : m.para);
    });
    return semAcento(partes.join(' | '));
  }

  function contem(valor, busca) {
    var b = semAcento((busca || '').trim());
    return !b || semAcento(valor || '').indexOf(b) !== -1;
  }

  // filtros: { nome, projeto, texto }. Todos juntos (E). Em "texto", cada palavra
  // digitada precisa aparecer em algum lugar da entrada (a ordem não importa).
  function filtrar(lista, filtros) {
    var f = filtros || {};
    var palavras = semAcento((f.texto || '').trim()).split(/\s+/).filter(Boolean);
    return lista.filter(function (e) {
      if (!contem(e.nome, f.nome) || !contem(e.projeto, f.projeto)) return false;
      if (!palavras.length) return true;
      var p = palheiro(e);
      return palavras.every(function (w) { return p.indexOf(w) !== -1; });
    });
  }

  return { CHAVE: CHAVE, MAXIMO: MAXIMO, TIPOS: TIPOS, ROTULO_CAMPO: ROTULO_CAMPO, ROTULO_TIPO: ROTULO_TIPO, quando: quando,
    DIAS_UTEIS: DIAS_UTEIS, venceEm: venceEm, podar: podar, remover: remover, sanear: sanear, carregar: carregar, salvar: salvar, adicionar: adicionar, diferencas: diferencas, filtrar: filtrar };
});
