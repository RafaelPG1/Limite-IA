/*
 * logica.js — regras dos registros, sem nada de tela (DOM).
 * Fica separado de propósito: assim dá para testar no terminal (testes.js)
 * e a interface (app.js) só cuida de mostrar e capturar cliques.
 */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) {
    module.exports = api; // Node (testes)
  } else {
    raiz.Registros = api; // Navegador
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CHAVE = 'registros:v1';
  const LIMITE = 80; // tamanho máximo de cada campo de texto
  const LIMITE_OBS = 200; // observações podem ser um pouco maiores

  function texto(valor, limite) {
    if (typeof valor !== 'string') return '';
    return valor.trim().slice(0, limite || LIMITE).trimEnd();
  }

  function dois(n) { return String(n).padStart(2, '0'); }

  /*
   * Aceita "19" (= 19:00), "9" (= 09:00), "19:30", "9:05" e "17:00:30".
   * Qualquer outra coisa (25, 17:3, abc) vira "" (sem horário).
   * Devolve sempre "HH:MM".
   */
  function normalizarHorario(valor) {
    if (typeof valor !== 'string') return '';
    const m = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$/.exec(valor.trim());
    if (!m) return '';
    const h = Number(m[1]);
    const min = m[2] === undefined ? 0 : Number(m[2]);
    if (h > 23 || min > 59) return '';
    return dois(h) + ':' + dois(min);
  }

  /*
   * Aceita, como o usuário digita:
   *   "27"         -> dia 27 do mês e ano atuais
   *   "27/10"      -> dia 27 de outubro do ano atual
   *   "27/10/2026" -> data completa (o ano é opcional)
   * e "2026-10-27" (como fica salvo).
   * Devolve sempre "AAAA-MM-DD", ou "" se não for uma data real (31/02, 31 em
   * mês de 30 dias, 00/10...). "agora" existe para os testes; no site é a data de hoje.
   */
  function normalizarData(valor, agora) {
    if (typeof valor !== 'string') return '';
    const t = valor.trim();
    const ref = agora || new Date();
    let ano, mes, dia;
    let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (m) {
      ano = Number(m[1]); mes = Number(m[2]); dia = Number(m[3]);
    } else {
      m = /^(\d{1,2})(?:\/(\d{1,2})(?:\/(\d{4}))?)?$/.exec(t);
      if (!m) return '';
      dia = Number(m[1]);
      mes = m[2] === undefined ? ref.getMonth() + 1 : Number(m[2]);
      ano = m[3] === undefined ? ref.getFullYear() : Number(m[3]);
    }
    if (ano < 2000 || ano > 2099) return '';
    const d = new Date(ano, mes - 1, dia);
    if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return '';
    return ano + '-' + dois(mes) + '-' + dois(dia);
  }

  /*
   * "2026-10-28" -> "28/10/2026" (para mostrar na tela).
   * Se "agora" for passado e a data for do ano atual, o ano é omitido: "28/10".
   */
  function dataParaTela(iso, agora) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof iso === 'string' ? iso : '');
    if (!m) return '';
    if (agora && Number(m[1]) === agora.getFullYear()) return m[3] + '/' + m[2];
    return m[3] + '/' + m[2] + '/' + m[1];
  }

  function gerarId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function montar(dados, id, agora) {
    const registro = {
      id: id,
      nome: texto(dados && dados.nome),
      projeto: texto(dados && dados.projeto),
      horario: normalizarHorario(dados && dados.horario),
      data: normalizarData(dados && dados.data, agora),
      estado: texto(dados && dados.estado),
      obs: texto(dados && dados.obs, LIMITE_OBS),
    };
    // "ordem" mantém cada registro no mesmo lugar em todos os aparelhos.
    const ordem = dados && dados.ordem;
    if (typeof ordem === 'number' && isFinite(ordem)) registro.ordem = ordem;
    return registro;
  }

  /*
   * Lista o que está errado no que o usuário digitou. Vazio = tudo certo.
   * Só o nome é obrigatório; horário e data podem ficar vazios, mas se forem
   * preenchidos precisam ser válidos (assim nada digitado é descartado em silêncio).
   */
  function erros(dados, agora) {
    const lista = [];
    if (!texto(dados && dados.nome)) lista.push('nome-obrigatorio');
    const h = dados && typeof dados.horario === 'string' ? dados.horario.trim() : '';
    if (h && !normalizarHorario(h)) lista.push('horario-invalido');
    const d = dados && typeof dados.data === 'string' ? dados.data.trim() : '';
    if (d && !normalizarData(d, agora)) lista.push('data-invalida');
    return lista;
  }

  function criarRegistro(dados, novoId, agora) {
    const problemas = erros(dados, agora);
    if (problemas.length) return { ok: false, erro: problemas[0], erros: problemas };
    return { ok: true, registro: montar(dados, (novoId || gerarId)(), agora) };
  }

  // Devolve uma lista nova; a original não é alterada.
  function editarRegistro(lista, id, dados, agora) {
    const indice = lista.findIndex(function (r) { return r.id === id; });
    if (indice === -1) return { ok: false, erro: 'nao-encontrado', erros: ['nao-encontrado'] };
    const problemas = erros(dados, agora);
    if (problemas.length) return { ok: false, erro: problemas[0], erros: problemas };
    const registro = montar(dados, id, agora);
    if (typeof lista[indice].ordem === 'number') registro.ordem = lista[indice].ordem;
    const nova = lista.slice();
    nova[indice] = registro;
    return { ok: true, lista: nova, registro: registro };
  }

  function removerRegistro(lista, id) {
    const indice = lista.findIndex(function (r) { return r.id === id; });
    if (indice === -1) return { lista: lista, removido: null, indice: -1 };
    const nova = lista.slice();
    const removido = nova.splice(indice, 1)[0];
    return { lista: nova, removido: removido, indice: indice };
  }

  function restaurarRegistro(lista, removido, indice) {
    if (!removido || lista.some(function (r) { return r.id === removido.id; })) return lista;
    const nova = lista.slice();
    const posicao = Math.max(0, Math.min(indice, nova.length));
    nova.splice(posicao, 0, removido);
    return nova;
  }

  /*
   * Regra do destaque verde (relógio local do dispositivo):
   *  - sem horário: nunca destaca (uma data sozinha também não destaca);
   *  - horário sem data: vale todo dia; fica verde a partir de HH:MM e volta
   *    ao normal à meia-noite;
   *  - horário com data: fica verde a partir daquele dia e hora e continua
   *    verde depois, até você editar.
   * O texto do estado nunca é tocado por esta regra.
   */
  function horarioAtingido(horario, agora, data) {
    const h = normalizarHorario(horario);
    if (!h) return false;
    const partes = h.split(':').map(Number);
    const ref = agora || new Date();
    const dia = normalizarData(data);
    if (dia) {
      const d = dia.split('-').map(Number);
      return ref.getTime() >= new Date(d[0], d[1] - 1, d[2], partes[0], partes[1], 0, 0).getTime();
    }
    return ref.getHours() * 60 + ref.getMinutes() >= partes[0] * 60 + partes[1];
  }

  function salvar(armazenamento, lista) {
    try {
      armazenamento.setItem(CHAVE, JSON.stringify(lista));
      return true;
    } catch (e) {
      return false; // armazenamento bloqueado ou cheio
    }
  }

  /*
   * Limpa uma lista vinda de fora (armazenamento ou nuvem):
   * ignora o que não é registro, exige nome, corrige campos e evita ids repetidos.
   */
  function sanearLista(bruta) {
    if (!Array.isArray(bruta)) return [];
    const vistos = new Set();
    const saida = [];
    bruta.forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      let id = typeof item.id === 'string' && item.id ? item.id : gerarId();
      if (vistos.has(id)) id = gerarId();
      const registro = montar(item, id);
      if (!registro.nome) return;
      vistos.add(id);
      saida.push(registro);
    });
    return saida;
  }

  // Lê e limpa os dados salvos. Dado estragado ou estranho nunca quebra a página.
  // Registros antigos, sem os campos "data", "obs" ou "ordem", continuam funcionando.
  function carregar(armazenamento) {
    try {
      const bruto = armazenamento.getItem(CHAVE);
      if (!bruto) return [];
      return sanearLista(JSON.parse(bruto));
    } catch (e) {
      return [];
    }
  }

  function comparar(a, b) {
    const d = (a.ordem || 0) - (b.ordem || 0);
    if (d) return d;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }

  // Ordem de exibição: a de criação; empate decidido pelo id (igual em todo aparelho).
  function ordenar(lista) {
    return lista.slice().sort(comparar);
  }

  // Registros antigos, sem "ordem", ganham uma pela posição em que estão.
  function garantirOrdem(lista) {
    return lista.map(function (r, i) {
      return typeof r.ordem === 'number' ? r : Object.assign({}, r, { ordem: i + 1 });
    });
  }

  return {
    CHAVE: CHAVE,
    LIMITE: LIMITE,
    LIMITE_OBS: LIMITE_OBS,
    normalizarHorario: normalizarHorario,
    normalizarData: normalizarData,
    dataParaTela: dataParaTela,
    erros: erros,
    criarRegistro: criarRegistro,
    editarRegistro: editarRegistro,
    removerRegistro: removerRegistro,
    restaurarRegistro: restaurarRegistro,
    horarioAtingido: horarioAtingido,
    salvar: salvar,
    carregar: carregar,
    sanearLista: sanearLista,
    ordenar: ordenar,
    garantirOrdem: garantirOrdem,
  };
});
