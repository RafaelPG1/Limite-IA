/*
 * app.js — tela: mostra a tabela, captura cliques e confere os horários.
 * As regras (validar, editar, salvar) ficam em logica.js.
 * Textos digitados pelo usuário entram sempre via textContent / value,
 * nunca como HTML, para que nada digitado vire código na página.
 */
(function () {
  'use strict';

  const R = window.Registros;
  const H = window.Historico;
  const CHAVE_MIGRADO = 'registros:nuvem-migrado';

  const ICONES = {
    editar: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 2.5l3 3M2.5 13.5l.8-3.2 7.4-7.4 2.4 2.4-7.4 7.4-3.2.8z"/></svg>',
    excluir: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5h11M6 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M4 4.5l.6 8a1 1 0 001 .9h4.8a1 1 0 001-.9l.6-8M6.75 7v4M9.25 7v4"/></svg>',
    salvar: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
    cancelar: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    atingido: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M5.5 8.2l1.8 1.8 3.2-3.6"/></svg>',
  };

  const el = {
    relogio: document.getElementById('relogio'),
    segundos: document.getElementById('segundos'),
    data: document.getElementById('data'),
    resumo: document.getElementById('resumo'),
    resTotal: document.getElementById('res-total'),
    resAtingidos: document.getElementById('res-atingidos'),
    aviso: document.getElementById('aviso'),
    form: document.getElementById('form-novo'),
    nome: document.getElementById('novo-nome'),
    projeto: document.getElementById('novo-projeto'),
    horario: document.getElementById('novo-horario'),
    dataNova: document.getElementById('novo-data'),
    estado: document.getElementById('novo-estado'),
    obs: document.getElementById('novo-obs'),
    caixa: document.getElementById('tabela-caixa'),
    corpo: document.getElementById('corpo'),
    vazio: document.getElementById('vazio'),
    toast: document.getElementById('toast'),
    toastTexto: document.getElementById('toast-texto'),
    desfazer: document.getElementById('toast-desfazer'),
    sync: document.getElementById('sync'),
    syncTexto: document.getElementById('sync-texto'),
    msg: document.getElementById('msg'),
    abrirHist: document.getElementById('abrir-historico'),
    hist: document.getElementById('historico'),
    histFechar: document.getElementById('hist-fechar'),
    histNome: document.getElementById('hist-nome'),
    histProjeto: document.getElementById('hist-projeto'),
    histTexto: document.getElementById('hist-texto'),
    histContagem: document.getElementById('hist-contagem'),
    histLista: document.getElementById('hist-lista'),
    histVazio: document.getElementById('hist-vazio'),
    histLimpar: document.getElementById('hist-limpar'),
    conf: document.getElementById('confirmar-limpar'),
    confCancelar: document.getElementById('conf-cancelar'),
    confApagar: document.getElementById('conf-apagar'),
  };

  let armazenamento = null;
  try { armazenamento = window.localStorage; } catch (e) { armazenamento = null; }

  let lista = armazenamento ? R.ordenar(R.garantirOrdem(R.carregar(armazenamento))) : [];
  let nuvem = null; // adaptador do Firestore (nuvem.js); null = só neste aparelho
  let jaConectou = false; // já recebemos dados confirmados pelo servidor
  let statusTravadoAte = 0; // um erro fica visível por um tempo, sem ser apagado por "Sincronizado"
  let migrado = false; // os registros que já existiam só neste aparelho já foram para a nuvem
  try { migrado = !!armazenamento && armazenamento.getItem(CHAVE_MIGRADO) === '1'; } catch (e) { migrado = false; }
  let historico = (H && armazenamento) ? H.podar(H.carregar(armazenamento), new Date()) : [];
  const jaAtingido = new Map(); // id -> estava verde na última conferência (para registrar a chegada)
  let ultimoExcluido = null; // { registro, indice } para o botão Desfazer
  let timerToast = null;
  let iniciado = false; // vira true depois da primeira desenhada da tela

  function entrando(tr) {
    tr.classList.add('entrando');
    setTimeout(function () { tr.classList.remove('entrando'); }, 450);
    return tr;
  }

  /* ---------- Persistência ---------- */
  // Sempre guarda uma cópia neste navegador (abre rápido e serve de reserva).
  function persistir() {
    const ok = armazenamento ? R.salvar(armazenamento, lista) : false;
    el.aviso.hidden = ok;
  }

  function enviarGravar(reg) { if (nuvem) nuvem.gravar(reg); }
  function enviarApagar(id) { if (nuvem) nuvem.apagar(id); }

  // Novo registro vai para o fim da lista, em qualquer aparelho.
  function proximaOrdem() {
    return lista.reduce(function (m, r) { return Math.max(m, r.ordem || 0); }, Date.now() - 1) + 1;
  }

  function mensagem(texto, ms) {
    el.msg.textContent = texto;
    el.msg.hidden = false;
    clearTimeout(mensagem.timer);
    mensagem.timer = setTimeout(function () { el.msg.hidden = true; }, ms || 7000);
  }

  /* ---------- Criação de elementos ---------- */
  function criar(tag, classe, texto) {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  function botao(acao, rotulo, icone, extra) {
    const b = criar('button', 'botao ' + (extra || 'botao-sutil'));
    b.type = 'button';
    b.dataset.acao = acao;
    b.insertAdjacentHTML('afterbegin', ICONES[icone]); // SVG fixo, sem dados do usuário
    b.appendChild(document.createTextNode(rotulo));
    return b;
  }

  function celula(classe, rotulo) {
    const td = criar('td', classe);
    td.dataset.rotulo = rotulo;
    return td;
  }

  // Cada nome ganha uma cor própria e estável (sempre a mesma para o mesmo nome).
  function matiz(nome) {
    let n = 0;
    for (let i = 0; i < nome.length; i++) n = (n * 31 + nome.charCodeAt(i)) % 360;
    return n;
  }

  function celulaNome(valor, obs) {
    const td = celula('nome', 'Nome');
    const pessoa = criar('div', 'pessoa');
    const avatar = criar('span', 'avatar', Array.from(valor)[0].toUpperCase());
    avatar.setAttribute('aria-hidden', 'true');
    avatar.style.setProperty('--matiz', String(matiz(valor.toLowerCase())));
    pessoa.appendChild(avatar);
    const bloco = criar('div', 'nome-bloco');
    bloco.appendChild(criar('span', 'nome-texto', valor));
    if (obs) bloco.appendChild(criar('span', 'obs-texto', obs)); // sem observação, nada aparece
    pessoa.appendChild(bloco);
    td.appendChild(pessoa);
    return td;
  }

  function celulaEstado(valor) {
    const td = celula('estado', 'Estado');
    if (valor) {
      const tipo = R.tipoEstado(valor); // LIVRE = verde, OK = azul; o texto digitado não muda
      td.appendChild(criar('span', 'chip' + (tipo ? ' chip-' + tipo : ''), valor));
    } else {
      td.appendChild(criar('span', 'vazio-traco', '—'));
      td.appendChild(criar('span', 'so-leitor', 'sem valor'));
    }
    return td;
  }

  function celulaTexto(classe, rotulo, valor) {
    const td = celula(classe, rotulo);
    if (valor) {
      td.textContent = valor;
    } else {
      td.appendChild(criar('span', 'vazio-traco', '—'));
      td.appendChild(criar('span', 'so-leitor', 'sem valor'));
    }
    return td;
  }

  /* ---------- Linhas ---------- */
  function montarLinha(reg) {
    const tr = criar('tr');
    tr.dataset.id = reg.id;

    tr.appendChild(celulaNome(reg.nome, reg.obs));
    tr.appendChild(celulaTexto('projeto', 'Projeto', reg.projeto));

    // Horário em cima; a data (quando existe) vai pequena logo abaixo.
    const tdHorario = celula('horario', 'Horário');
    if (reg.horario || reg.data) {
      const bloco = criar('div', 'hora-bloco');
      if (reg.horario) {
        const grupoHora = criar('div', 'hora-grupo');
        grupoHora.appendChild(criar('span', 'hora-texto', reg.horario));
        const selo = criar('span', 'selo');
        selo.hidden = true;
        selo.insertAdjacentHTML('afterbegin', ICONES.atingido);
        selo.appendChild(document.createTextNode('Atingido'));
        grupoHora.appendChild(selo);
        bloco.appendChild(grupoHora);
      }
      if (reg.data) bloco.appendChild(criar('span', 'data-texto', R.dataParaTela(reg.data, new Date())));
      tdHorario.appendChild(bloco);
    } else {
      tdHorario.appendChild(criar('span', 'vazio-traco', '—'));
      tdHorario.appendChild(criar('span', 'so-leitor', 'sem valor'));
    }
    tr.appendChild(tdHorario);

    tr.appendChild(celulaEstado(reg.estado));

    const tdAcoes = celula('acoes', 'Ações');
    const grupo = criar('div', 'acoes-grupo');
    grupo.appendChild(botao('editar', 'Editar', 'editar'));
    grupo.appendChild(botao('excluir', 'Excluir', 'excluir', 'botao-sutil botao-perigo'));
    tdAcoes.appendChild(grupo);
    tr.appendChild(tdAcoes);

    aplicarDestaque(tr, R.horarioAtingido(reg.horario, new Date(), reg.data));
    return tr;
  }

  const MENSAGEM = {
    nome: 'O nome não pode ficar vazio.',
    horario: 'Horário inválido. Use 19 ou 19:30.',
    data: 'Data inválida. Use o dia (27) ou dia/mês (27/10).',
  };

  let contadorCampos = 0;

  // Campo de edição com o rótulo sempre visível em cima (e "(opcional)" quando for o caso).
  function comRotulo(rotulo, opcional, input) {
    input.id = 'ed-' + (++contadorCampos);
    const caixa = criar('div', 'campo-edicao');
    const l = criar('label', 'rotulo-edicao', rotulo);
    l.htmlFor = input.id;
    if (opcional) l.appendChild(criar('span', 'opcional', ' (opcional)'));
    caixa.appendChild(l);
    caixa.appendChild(input);
    return caixa;
  }

  function entradaTexto(nome, valor, limite, placeholder) {
    const input = criar('input');
    input.type = 'text';
    input.name = nome;
    input.value = valor;
    input.maxLength = limite;
    input.autocomplete = 'off';
    if (placeholder) input.placeholder = placeholder;
    return input;
  }

  // Campo de edição com máscara (horário ou data), com seu rótulo e a mensagem de erro.
  function entradaMascarada(td, nome, rotulo, opcional, valor, tipoMascara, placeholder, tamanho) {
    const input = criar('input');
    input.type = 'text';
    input.name = nome;
    input.value = valor;
    input.placeholder = placeholder;
    input.maxLength = tamanho;
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.dataset.mascara = tipoMascara;
    td.appendChild(comRotulo(rotulo, opcional, input));
    td.appendChild(mensagemErro(nome));
  }

  function mensagemErro(campo) {
    const p = criar('p', 'erro', MENSAGEM[campo]);
    p.dataset.campo = campo;
    p.dataset.padrao = MENSAGEM[campo];
    p.hidden = true;
    p.setAttribute('role', 'alert');
    return p;
  }

  function montarLinhaEdicao(reg) {
    const tr = criar('tr', 'editando');
    tr.dataset.id = reg.id;

    const tdNome = celula('nome', 'Nome');
    const pilhaNome = criar('div', 'pilha');
    const inputNome = entradaTexto('nome', reg.nome, R.LIMITE, '');
    inputNome.autocapitalize = 'sentences';
    pilhaNome.appendChild(comRotulo('Nome', false, inputNome));
    pilhaNome.appendChild(mensagemErro('nome'));
    pilhaNome.appendChild(comRotulo('Observações', true, entradaTexto('obs', reg.obs, R.LIMITE_OBS, '')));
    tdNome.appendChild(pilhaNome);
    tr.appendChild(tdNome);

    const tdProjeto = celula('projeto', 'Projeto');
    tdProjeto.appendChild(comRotulo('Projeto', true, entradaTexto('projeto', reg.projeto, R.LIMITE, '')));
    tr.appendChild(tdProjeto);

    // Horário e data (ambos opcionais) dividem a mesma coluna, um embaixo do outro.
    const tdHorario = celula('horario', 'Horário');
    const pilha = criar('div', 'pilha');
    entradaMascarada(pilha, 'horario', 'Horário', true, reg.horario, 'hora', '19 ou 19:30', 5);
    entradaMascarada(pilha, 'data', 'Data', true, R.dataParaTela(reg.data, new Date()), 'data', '27 ou 27/10', 10);
    tdHorario.appendChild(pilha);
    tr.appendChild(tdHorario);

    const tdEstado = celula('estado', 'Estado');
    tdEstado.appendChild(comRotulo('Estado', true, entradaTexto('estado', reg.estado, R.LIMITE, '')));
    tr.appendChild(tdEstado);

    const tdAcoes = celula('acoes', 'Ações');
    const grupo = criar('div', 'acoes-grupo');
    grupo.appendChild(botao('salvar', 'Salvar', 'salvar', 'botao-primario'));
    grupo.appendChild(botao('cancelar', 'Cancelar', 'cancelar'));
    tdAcoes.appendChild(grupo);
    tr.appendChild(tdAcoes);

    return tr;
  }

  function aplicarDestaque(tr, atingido) {
    if (tr.classList.contains('atingido') !== atingido) {
      tr.classList.toggle('atingido', atingido);
      // Pequeno pulso só quando o horário chega com a página aberta (não ao carregar).
      if (atingido && iniciado) {
        tr.classList.add('chegou');
        setTimeout(function () { tr.classList.remove('chegou'); }, 1700);
      }
    }
    const selo = tr.querySelector('.selo');
    if (selo && selo.hidden === atingido) selo.hidden = !atingido;
  }

  function iguais(a, b) {
    return !!a && ['nome', 'projeto', 'horario', 'data', 'estado', 'obs'].every(function (k) { return a[k] === b[k]; });
  }

  /*
   * Põe a tabela de acordo com a lista nova mexendo só no que mudou.
   * Assim, uma atualização vinda de outro aparelho não derruba a linha
   * que você está editando nem tira o foco do campo.
   */
  function aplicarLista(nova) {
    const antigas = new Map(lista.map(function (r) { return [r.id, r]; }));
    const linhas = new Map();
    Array.prototype.forEach.call(el.corpo.children, function (tr) { linhas.set(tr.dataset.id, tr); });
    lista = nova;
    let cursor = el.corpo.firstElementChild;
    nova.forEach(function (reg) {
      const atual = linhas.get(reg.id);
      linhas.delete(reg.id);
      const emEdicao = !!atual && atual.classList.contains('editando');
      if (atual && (emEdicao || iguais(antigas.get(reg.id), reg))) {
        if (atual === cursor) cursor = cursor.nextElementSibling;
        else el.corpo.insertBefore(atual, cursor);
        return;
      }
      const nova_tr = montarLinha(reg);
      if (!atual && iniciado) entrando(nova_tr);
      if (atual) {
        if (atual === cursor) cursor = atual.nextElementSibling;
        atual.remove();
      }
      el.corpo.insertBefore(nova_tr, cursor);
    });
    linhas.forEach(function (tr) { tr.remove(); }); // registros que sumiram em outro aparelho
    atualizarVazio();
  }

  function atualizarVazio() {
    const vazia = lista.length === 0;
    el.vazio.hidden = !vazia;
    el.caixa.hidden = vazia;
    atualizarResumo(new Date());
  }

  function plural(n, singular, pluralTxt) {
    return n + ' ' + (n === 1 ? singular : pluralTxt);
  }

  function atualizarResumo(agora) {
    const total = lista.length;
    el.resumo.hidden = total === 0;
    if (total === 0) return;
    const atingidos = lista.filter(function (r) { return R.horarioAtingido(r.horario, agora, r.data); }).length;
    el.resTotal.textContent = plural(total, 'registro', 'registros');
    el.resAtingidos.hidden = atingidos === 0;
    el.resAtingidos.textContent = atingidos === 1 ? '1 no horário' : atingidos + ' no horário';
  }

  /* ---------- Histórico ---------- */
  const ROTULO_TIPO = { criado: 'Criado', editado: 'Editado', excluido: 'Excluído', atingido: 'Horário atingido' };

  // Apaga do histórico o que passou de 1 dia útil. Roda ao abrir, ao registrar e a cada minuto.
  function podarHistorico() {
    if (!H) return;
    const nova = H.podar(historico, new Date());
    if (nova === historico) return;
    historico = nova;
    if (armazenamento) H.salvar(armazenamento, historico);
    if (el.hist.open) desenharHistorico();
  }

  function registrar(tipo, reg, mudancas) {
    if (!H) return;
    historico = H.podar(historico, new Date());
    historico = H.adicionar(historico, {
      t: Date.now(), tipo: tipo, id: reg.id, nome: reg.nome, projeto: reg.projeto, horario: reg.horario,
      data: reg.data, estado: reg.estado, obs: reg.obs, mudancas: mudancas || [],
    });
    if (armazenamento) H.salvar(armazenamento, historico);
    if (el.hist.open) desenharHistorico();
  }

  function valorDoHistorico(campo, v) {
    if (!v) return '—';
    return campo === 'data' ? R.dataParaTela(v, new Date()) : v;
  }

  function quandoTexto(t) {
    return new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function desenharHistorico() {
    const filtrado = H.filtrar(historico, { nome: el.histNome.value, projeto: el.histProjeto.value, texto: el.histTexto.value });
    el.histLista.textContent = '';
    filtrado.forEach(function (e) {
      const li = criar('li', 'hist-item');
      const etiqueta = criar('span', 'hist-etiqueta', ROTULO_TIPO[e.tipo]);
      etiqueta.dataset.tipo = e.tipo;
      li.appendChild(etiqueta);
      li.appendChild(criar('span', 'hist-nome', e.nome));
      li.appendChild(criar('span', 'hist-quando', quandoTexto(e.t)));
      // Como o registro estava: é nisso que Projeto e Buscar procuram, então fica à vista.
      const resumo = [['projeto', e.projeto], ['horario', e.horario], ['data', e.data], ['estado', e.estado], ['obs', e.obs]]
        .filter(function (par) { return par[1]; });
      if (resumo.length) {
        const p = criar('p', 'hist-resumo');
        resumo.forEach(function (par, i) {
          if (i) p.appendChild(document.createTextNode(' · '));
          p.appendChild(criar('b', null, H.ROTULO_CAMPO[par[0]] + ': '));
          p.appendChild(document.createTextNode(valorDoHistorico(par[0], par[1])));
        });
        li.appendChild(p);
      }
      if (e.mudancas.length) {
        const ul = criar('ul', 'hist-mudancas');
        e.mudancas.forEach(function (m) {
          const item = criar('li');
          item.appendChild(criar('b', null, H.ROTULO_CAMPO[m.campo] + ': '));
          item.appendChild(document.createTextNode(valorDoHistorico(m.campo, m.de) + ' → ' + valorDoHistorico(m.campo, m.para)));
          ul.appendChild(item);
        });
        li.appendChild(ul);
      }
      const apagar = criar('button', 'botao botao-sutil hist-apagar');
      apagar.type = 'button';
      apagar.setAttribute('aria-label', 'Apagar esta entrada: ' + ROTULO_TIPO[e.tipo] + ' ' + e.nome);
      apagar.innerHTML = ICONES.excluir;
      apagar.addEventListener('click', function () {
        historico = H.remover(historico, e);
        if (armazenamento) H.salvar(armazenamento, historico);
        desenharHistorico();
        if (!historico.length) el.histTexto.focus();
      });
      li.appendChild(apagar);
      el.histLista.appendChild(li);
    });
    const filtrando = el.histNome.value.trim() !== '' || el.histProjeto.value.trim() !== '' || el.histTexto.value.trim() !== '';
    el.histContagem.textContent = historico.length
      ? (filtrando ? filtrado.length + ' de ' + historico.length + ' entradas' : historico.length + (historico.length === 1 ? ' entrada' : ' entradas'))
      : '';
    el.histVazio.hidden = filtrado.length > 0;
    el.histVazio.textContent = historico.length ? 'Nada encontrado com esses filtros.' : 'Ainda não há nada no histórico. Criar, editar e excluir registros aparece aqui.';
    el.histLimpar.disabled = !historico.length;
  }

  function abrirHistorico() {
    podarHistorico();
    desenharHistorico();
    if (typeof el.hist.showModal === 'function') el.hist.showModal(); else el.hist.setAttribute('open', '');
    el.histTexto.focus();
  }

  function fecharHistorico() {
    if (typeof el.hist.close === 'function') el.hist.close(); else el.hist.removeAttribute('open');
    el.abrirHist.focus();
  }

  if (H) {
    el.abrirHist.addEventListener('click', abrirHistorico);
    el.histFechar.addEventListener('click', fecharHistorico);
    // Clique fora da janela (no fundo escuro) fecha.
    el.hist.addEventListener('click', function (ev) { if (ev.target === el.hist) fecharHistorico(); });
    [el.histNome, el.histProjeto, el.histTexto].forEach(function (c) { c.addEventListener('input', desenharHistorico); });
    // Limpar tudo pede confirmação numa janela própria.
    el.histLimpar.addEventListener('click', function () {
      if (typeof el.conf.showModal === 'function') el.conf.showModal(); else el.conf.setAttribute('open', '');
      el.confCancelar.focus();
    });
    function fecharConfirmacao() {
      if (typeof el.conf.close === 'function') el.conf.close(); else el.conf.removeAttribute('open');
    }
    el.confCancelar.addEventListener('click', function () { fecharConfirmacao(); el.histLimpar.focus(); });
    el.conf.addEventListener('click', function (ev) { if (ev.target === el.conf) fecharConfirmacao(); });
    el.confApagar.addEventListener('click', function () {
      historico = [];
      if (armazenamento) H.salvar(armazenamento, historico);
      fecharConfirmacao();
      desenharHistorico();
      el.histTexto.focus();
    });
    setInterval(podarHistorico, 60000);
  } else {
    el.abrirHist.hidden = true;
  }

  function achar(id) {
    return lista.find(function (r) { return r.id === id; });
  }

  /* ---------- Relógio e destaque automático ---------- */
  function verificarHorarios() {
    const agora = new Date();

    const hora = String(agora.getHours()).padStart(2, '0') + ':' + String(agora.getMinutes()).padStart(2, '0');
    if (el.relogio.textContent !== hora) {
      el.relogio.textContent = hora;
      el.data.textContent = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    el.segundos.textContent = ':' + String(agora.getSeconds()).padStart(2, '0');

    const linhas = el.corpo.children;
    for (let i = 0; i < linhas.length; i++) {
      const tr = linhas[i];
      if (tr.classList.contains('editando')) continue; // não mexe em quem está sendo editado
      const reg = achar(tr.dataset.id);
      if (reg) {
        const atingido = R.horarioAtingido(reg.horario, agora, reg.data);
        aplicarDestaque(tr, atingido);
        if (jaAtingido.get(reg.id) === false && atingido) registrar('atingido', reg);
        jaAtingido.set(reg.id, atingido);
      }
    }
    atualizarResumo(agora);
  }

  /* ---------- Adicionar ---------- */
  const CAMPO_DO_ERRO = { 'nome-obrigatorio': 'nome', 'nome-duplicado': 'nome', 'horario-invalido': 'horario', 'data-invalida': 'data' };
  const TEXTO_DUPLICADO = 'Já existe um registro com esse nome. Use outro nome.';

  // Mostra (ou limpa) o erro de cada campo dentro do formulário ou da linha em edição.
  function mostrarErros(escopo, codigos) {
    const comErro = codigos.map(function (c) { return CAMPO_DO_ERRO[c]; });
    let primeiro = null;
    ['nome', 'horario', 'data'].forEach(function (campo) {
      const input = escopo.querySelector('input[name="' + campo + '"]');
      const msg = escopo.querySelector('.erro[data-campo="' + campo + '"]');
      if (!input || !msg) return;
      const tem = comErro.indexOf(campo) !== -1;
      msg.textContent = campo === 'nome' && codigos.indexOf('nome-duplicado') !== -1 ? TEXTO_DUPLICADO : (msg.dataset.padrao || msg.textContent);
      msg.hidden = !tem;
      input.setAttribute('aria-invalid', tem ? 'true' : 'false');
      if (tem && !primeiro) primeiro = input;
    });
    if (primeiro) primeiro.focus();
  }

  // A lista é sempre exibida em ordem alfabética (OK em cima); um registro novo entra no lugar certo.
  function registrarNovo(registro) {
    aplicarLista(R.ordenar(lista.concat(registro)));
    persistir();
    enviarGravar(registro);
    registrar('criado', registro);
    jaAtingido.set(registro.id, R.horarioAtingido(registro.horario, new Date(), registro.data));
    mostrarLinha(registro.id);
  }

  function mostrarLinha(id) {
    const tr = el.corpo.querySelector('tr[data-id="' + id + '"]');
    if (tr && tr.scrollIntoView) tr.scrollIntoView({ block: 'nearest' });
  }

  el.form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    const res = R.criarRegistro({
      nome: el.nome.value,
      projeto: el.projeto.value,
      horario: el.horario.value,
      data: el.dataNova.value,
      estado: el.estado.value,
      obs: el.obs.value,
    }, undefined, undefined, lista);
    if (!res.ok) {
      mostrarErros(el.form, res.erros);
      return;
    }
    mostrarErros(el.form, []);
    res.registro.ordem = proximaOrdem();
    registrarNovo(res.registro);
    el.form.reset();
    el.nome.focus();
  });

  /* ---------- Máscaras: horário (HH:MM) e data (DD/MM/AAAA) ---------- */
  // Você digita só números; os separadores entram sozinhos (1730 vira 17:30).
  function mascara(tipo, valor) {
    if (tipo === 'hora') {
      const bruto = valor.replace(/[^\d:]/g, '');
      // Se você digitou os dois pontos, eles são respeitados: 1:30 continua 1:30.
      if (bruto.indexOf(':') !== -1) {
        const p = bruto.split(':');
        return p[0].slice(0, 2) + ':' + p[1].slice(0, 2);
      }
      const d = bruto;
      // 930 só pode ser 9:30 (a hora 93 não existe), então a hora fica com 1 dígito.
      if (d.length >= 3 && Number(d.slice(0, 2)) > 23) return d[0] + ':' + d.slice(1, 3);
      const s = d.slice(0, 4);
      return s.length > 2 ? s.slice(0, 2) + ':' + s.slice(2) : s;
    }
    // Data: "/", "." ou "-" digitados viram "/" e são respeitados (5/12 continua 5/12).
    const bruto = valor.replace(/[^\d/.\-\s]/g, '').replace(/[.\-\s]+/g, '/');
    if (bruto.indexOf('/') !== -1) {
      const p = bruto.split('/');
      let dia = p[0];
      let mes = p[1];
      let ano = p[2];
      // O que passar do tamanho de uma parte segue para a próxima (28/102 -> 28/10/2).
      if (dia.length > 2) { mes = dia.slice(2) + (mes || ''); dia = dia.slice(0, 2); }
      if (mes !== undefined && mes.length > 2) { ano = mes.slice(2) + (ano || ''); mes = mes.slice(0, 2); }
      let saida = dia;
      if (mes !== undefined) saida += '/' + mes;
      if (ano !== undefined) saida += '/' + ano.slice(0, 4);
      return saida;
    }
    const s = bruto.slice(0, 8);
    if (s.length > 4) return s.slice(0, 2) + '/' + s.slice(2, 4) + '/' + s.slice(4);
    if (s.length > 2) return s.slice(0, 2) + '/' + s.slice(2);
    return s;
  }

  // Ao sair do campo, mostra o valor que será guardado: 19 vira 19:00, 27 vira 27/10.
  document.addEventListener('focusout', function (ev) {
    const campo = ev.target;
    // "livre" e "ok" (de qualquer jeito) passam a LIVRE e OK assim que você sai do campo.
    if (campo && campo.tagName === 'INPUT' && campo.name === 'estado' && R.tipoEstado(campo.value)) {
      campo.value = campo.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toUpperCase();
    }
    if (!campo || campo.tagName !== 'INPUT' || !campo.dataset.mascara || !campo.value.trim()) return;
    if (campo.dataset.mascara === 'hora') {
      const h = R.normalizarHorario(campo.value);
      if (h) campo.value = h;
    } else {
      const agora = new Date();
      const d = R.normalizarData(campo.value, agora);
      if (d) campo.value = R.dataParaTela(d, agora);
    }
  });

  // Vale para o formulário e para as linhas em edição.
  document.addEventListener('input', function (ev) {
    const campo = ev.target;
    if (!campo || campo.tagName !== 'INPUT') return;
    // A primeira letra do nome é sempre maiúscula: minúscula não chega a ficar no campo.
    if (campo.name === 'nome' && campo.value) {
      const certo = R.capitalizarNome(campo.value);
      if (certo !== campo.value) {
        const ini = campo.selectionStart, fim = campo.selectionEnd;
        campo.value = certo;
        try { campo.setSelectionRange(ini, fim); } catch (e) { /* campo sem seleção */ }
      }
    }
    if (campo.dataset.mascara) {
      const formatado = mascara(campo.dataset.mascara, campo.value);
      if (formatado !== campo.value) campo.value = formatado;
    }
    // Ao voltar a digitar num campo com erro, o aviso some.
    if (campo.getAttribute('aria-invalid') === 'true') {
      const escopo = campo.closest('form, tr');
      const msg = escopo && escopo.querySelector('.erro[data-campo="' + campo.name + '"]');
      campo.setAttribute('aria-invalid', 'false');
      if (msg) msg.hidden = true;
    }
  });

  /* ---------- Editar, salvar, cancelar, excluir ---------- */
  function iniciarEdicao(tr) {
    const reg = achar(tr.dataset.id);
    if (!reg) return;
    const nova = montarLinhaEdicao(reg);
    tr.replaceWith(nova);
    nova.querySelector('input').focus();
  }

  function salvarEdicao(tr) {
    const id = tr.dataset.id;
    const valor = function (nome) { return tr.querySelector('input[name="' + nome + '"]').value; };
    const antes = achar(id);
    const res = R.editarRegistro(lista, id, {
      nome: valor('nome'),
      projeto: valor('projeto'),
      horario: valor('horario'),
      data: valor('data'),
      estado: valor('estado'),
      obs: valor('obs'),
    });
    if (!res.ok) {
      mostrarErros(tr, res.erros);
      return;
    }
    lista = res.lista;
    persistir();
    enviarGravar(res.registro);
    const mudancas = H ? H.diferencas(antes, res.registro) : [];
    if (mudancas.length) registrar('editado', res.registro, mudancas);
    jaAtingido.set(res.registro.id, R.horarioAtingido(res.registro.horario, new Date(), res.registro.data));
    const nova = montarLinha(res.registro);
    tr.replaceWith(nova);
    aplicarLista(R.ordenar(lista)); // nome ou estado podem ter mudado: reposiciona a linha
    atualizarResumo(new Date());
    nova.querySelector('[data-acao="editar"]').focus();
    mostrarLinha(res.registro.id);
  }

  function cancelarEdicao(tr) {
    const reg = achar(tr.dataset.id);
    if (!reg) return;
    const nova = montarLinha(reg);
    tr.replaceWith(nova);
    nova.querySelector('[data-acao="editar"]').focus();
  }

  function excluir(tr) {
    const res = R.removerRegistro(lista, tr.dataset.id);
    if (!res.removido) return;
    lista = res.lista;
    persistir();
    enviarApagar(res.removido.id);
    registrar('excluido', res.removido);
    jaAtingido.delete(res.removido.id);
    tr.remove();
    atualizarVazio();
    ultimoExcluido = { registro: res.removido, indice: res.indice };
    mostrarToast('Excluído: ' + res.removido.nome);
    el.nome.focus();
  }

  el.corpo.addEventListener('click', function (ev) {
    const alvo = ev.target.closest('button[data-acao]');
    if (!alvo) return;
    const tr = alvo.closest('tr');
    switch (alvo.dataset.acao) {
      case 'editar': iniciarEdicao(tr); break;
      case 'salvar': salvarEdicao(tr); break;
      case 'cancelar': cancelarEdicao(tr); break;
      case 'excluir': excluir(tr); break;
    }
  });

  // Enter salva e Esc cancela enquanto a linha está em edição.
  el.corpo.addEventListener('keydown', function (ev) {
    const tr = ev.target.closest('tr.editando');
    if (!tr || ev.target.tagName !== 'INPUT') return;
    if (ev.key === 'Enter') { ev.preventDefault(); salvarEdicao(tr); }
    if (ev.key === 'Escape') { ev.preventDefault(); cancelarEdicao(tr); }
  });

  /* ---------- Desfazer exclusão ---------- */
  function mostrarToast(mensagem) {
    el.toastTexto.textContent = mensagem;
    el.toast.hidden = false;
    clearTimeout(timerToast);
    timerToast = setTimeout(esconderToast, 7000);
  }

  function esconderToast() {
    el.toast.hidden = true;
    ultimoExcluido = null;
  }

  el.desfazer.addEventListener('click', function () {
    if (!ultimoExcluido) return;
    const item = ultimoExcluido;
    const restaurada = R.restaurarRegistro(lista, item.registro, item.indice);
    if (restaurada === lista) { // já existe outro registro com esse nome: desfazer duplicaria
      esconderToast();
      mensagem('Não foi possível desfazer: já existe um registro chamado ' + item.registro.nome + '.');
      return;
    }
    lista = R.ordenar(restaurada);
    persistir();
    enviarGravar(item.registro);
    if (H) { // desfazer = a exclusão não aconteceu: tira a entrada dela do histórico
      const i = historico.findIndex(function (e) { return e.tipo === 'excluido' && e.id === item.registro.id; });
      if (i !== -1) {
        historico = historico.slice(0, i).concat(historico.slice(i + 1));
        if (armazenamento) H.salvar(armazenamento, historico);
      }
    }
    const posicao = lista.findIndex(function (r) { return r.id === item.registro.id; });
    el.corpo.insertBefore(entrando(montarLinha(item.registro)), el.corpo.children[posicao] || null);
    atualizarVazio();
    clearTimeout(timerToast);
    esconderToast();
  });

  /* ---------- Nuvem (Firestore): só liga se o nuvem.js carregar ---------- */
  function definirStatus(tipo, texto) {
    el.sync.hidden = false;
    el.sync.dataset.tipo = tipo;
    el.syncTexto.textContent = texto;
  }

  function statusPorMeta(meta) {
    if (Date.now() < statusTravadoAte) return;
    if (meta.doCache && !jaConectou) definirStatus('espera', 'Conectando à nuvem…');
    else if (meta.doCache) definirStatus('aviso', 'Sem conexão. Alterações ficam salvas aqui e seguem quando voltar. Com internet ok, confira se um bloqueador de anúncios está bloqueando o Firebase.');
    else if (meta.pendente) definirStatus('espera', 'Enviando alterações…');
    else definirStatus('ok', 'Sincronizado');
  }

  function receber(brutos, meta) {
    const daNuvem = R.sanearLista(brutos);
    let nova = daNuvem;
    // Primeira vez neste aparelho: o que já existia só aqui sobe para a nuvem (nada se perde).
    if (!migrado) {
      const ids = new Set(daNuvem.map(function (r) { return r.id; }));
      const faltam = lista.filter(function (r) { return !ids.has(r.id); });
      if (faltam.length) { nuvem.gravarVarios(faltam); nova = daNuvem.concat(faltam); }
      migrado = true;
      try { armazenamento.setItem(CHAVE_MIGRADO, '1'); } catch (e) { /* sem armazenamento: tudo bem */ }
    }
    if (!meta.doCache) jaConectou = true;
    aplicarLista(R.ordenar(nova));
    persistir();
    statusPorMeta(meta);
  }

  window.RegistrosApp = {
    nuvemCarregando: function () { definirStatus('espera', 'Conectando à nuvem…'); },
    nuvemFalhou: function () {
      definirStatus('aviso', 'Nuvem indisponível. Salvando só neste aparelho.');
    },
    nuvemErro: function (codigo) {
      if (codigo === 'permission-denied') {
        definirStatus('erro', 'O banco bloqueou o acesso. Publique as regras do Firestore (veja o LEIA-ME).');
        statusTravadoAte = Date.now() + 60000;
      } else {
        definirStatus('erro', 'Erro ao sincronizar. Salvando neste aparelho.');
        statusTravadoAte = Date.now() + 20000;
      }
    },
    conectar: function (adaptador) {
      nuvem = adaptador;
      definirStatus('espera', 'Conectando à nuvem…');
      nuvem.observar(receber, function (codigo) {
        window.RegistrosApp.nuvemErro(codigo);
        statusTravadoAte = Infinity; // a escuta parou; o erro não pode sumir
        nuvem = null; // volta ao modo só deste aparelho
      });
      setTimeout(function () {
        if (!jaConectou && nuvem && Date.now() >= statusTravadoAte) {
          definirStatus('aviso', 'Sem conexão. Alterações ficam salvas aqui e seguem quando voltar. Com internet ok, confira se um bloqueador de anúncios está bloqueando o Firebase.');
        }
      }, 10000);
    },
  };

  /* ---------- Início ---------- */
  aplicarLista(lista);
  persistir();
  verificarHorarios();
  iniciado = true;

  setInterval(verificarHorarios, 1000);
  // Abas em segundo plano podem pausar o relógio: confere assim que a página volta.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) verificarHorarios();
  });
  window.addEventListener('pageshow', verificarHorarios);

  // Mesma página aberta em duas abas: acompanha as mudanças da outra,
  // para uma aba não apagar o que a outra salvou.
  window.addEventListener('storage', function (ev) {
    if (ev.key !== R.CHAVE || !armazenamento || nuvem) return; // com a nuvem, ela mesma avisa
    aplicarLista(R.ordenar(R.garantirOrdem(R.carregar(armazenamento))));
    verificarHorarios();
  });
})();
