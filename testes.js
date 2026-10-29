/*
 * testes.js — confere as regras de logica.js. Não precisa instalar nada.
 * Rodar:  node --test testes.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('./logica.js');

// Armazenamento falso (imita o localStorage do navegador).
function armazenamentoFalso() {
  const dados = {};
  return {
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v); },
  };
}
const contador = () => { let n = 0; return () => 'id' + (++n); };
const hoje = (h, m) => new Date(2026, 9, 27, h, m, 0);

test('cadastro: só o nome basta (exemplo USUARIO123)', () => {
  const r = R.criarRegistro({ nome: 'USUARIO123' }, contador());
  assert.equal(r.ok, true);
  assert.deepEqual(r.registro, { id: 'id1', nome: 'USUARIO123', projeto: '', horario: '', data: R.proximaData(''), estado: '', obs: '' });
});

test('cadastro: aceita qualquer combinação dos opcionais', () => {
  const a = R.criarRegistro({ nome: 'RAFAEL472', estado: 'Liberado para uso' }, contador());
  assert.equal(a.registro.estado, 'Liberado para uso');
  assert.equal(a.registro.projeto, '');
  const b = R.criarRegistro({ nome: 'SISTEMA', projeto: 'Manutenção', horario: '20:00' }, contador());
  assert.equal(b.registro.horario, '20:00');
  assert.equal(b.registro.estado, '');
  const c = R.criarRegistro({ nome: 'RAFAEL', projeto: 'PROJETO X', horario: '17:00', estado: 'OK' }, contador());
  assert.equal(c.ok, true);
});

test('cadastro: sem nome (vazio, só espaços ou ausente) é recusado', () => {
  assert.equal(R.criarRegistro({ nome: '' }).ok, false);
  assert.equal(R.criarRegistro({ nome: '   ' }).ok, false);
  assert.equal(R.criarRegistro({ projeto: 'X', horario: '10:00' }).ok, false);
  assert.equal(R.criarRegistro(undefined).ok, false);
});

test('cadastro: horário digitado errado é recusado (não some em silêncio)', () => {
  assert.deepEqual(R.criarRegistro({ nome: 'A', horario: '25:99' }).erros, ['horario-invalido']);
  assert.deepEqual(R.criarRegistro({ nome: 'A', horario: 'abc' }).erros, ['horario-invalido']);
  assert.deepEqual(R.criarRegistro({ nome: 'A', horario: '17:3' }).erros, ['horario-invalido']);
  assert.equal(R.criarRegistro({ nome: 'A', horario: '9:05' }, contador()).registro.horario, '09:05');
  assert.equal(R.criarRegistro({ nome: 'A', horario: '  ' }, contador()).ok, true, 'só espaços = vazio');
});

test('data: aceita DD/MM/AAAA e AAAA-MM-DD; guarda sempre AAAA-MM-DD', () => {
  assert.equal(R.normalizarData('28/10/2026'), '2026-10-28');
  assert.equal(R.normalizarData('2026-10-28'), '2026-10-28');
  assert.equal(R.normalizarData('1/2/2027'), '2027-02-01');
  assert.equal(R.normalizarData('29/02/2028'), '2028-02-29', 'ano bissexto');
  assert.equal(R.dataParaTela('2026-10-28'), '28/10/2026');
  assert.equal(R.dataParaTela(''), '');
});

test('data: datas que não existem são recusadas, vazio é permitido', () => {
  ['31/02/2026', '29/02/2027', '00/10/2026', '10/13/2026', '28/10/1999', '28/10/2100', '28-10-2026', 'abc'].forEach((d) => {
    assert.deepEqual(R.criarRegistro({ nome: 'A', data: d }).erros, ['data-invalida'], d);
  });
  const ok = R.criarRegistro({ nome: 'A', data: '' }, contador());
  assert.equal(ok.ok, true);
  assert.equal(ok.registro.data, R.proximaData(''), 'vazio: data automática');
});

test('cadastro: todos os erros aparecem juntos', () => {
  assert.deepEqual(R.criarRegistro({ nome: '', horario: '99:99', data: '31/02/2026' }).erros,
    ['nome-obrigatorio', 'horario-invalido', 'data-invalida']);
});

test('edição: data pode ser colocada, trocada e removida; erro não altera nada', () => {
  const ids = contador();
  const lista = [R.criarRegistro({ nome: 'A', horario: '10:00' }, ids).registro];
  const e1 = R.editarRegistro(lista, 'id1', { nome: 'A', horario: '10:00', data: '28/10/2026' });
  assert.equal(e1.lista[0].data, '2026-10-28');
  const e2 = R.editarRegistro(e1.lista, 'id1', { nome: 'A', horario: '10:00', data: '' });
  assert.equal(e2.lista[0].data, e2.lista[0].data, e2.lista[0].data, 'sem data e com horário: preenche com hoje');
  assert.match(e2.lista[0].data, /^\d{4}-\d{2}-\d{2}$/);
  const e2b = R.editarRegistro(lista, 'id1', { nome: 'A', horario: '', data: '' });
  assert.equal(e2b.lista[0].data, R.proximaData(''), 'sem horário e sem data: hoje');
  const e3 = R.editarRegistro(e1.lista, 'id1', { nome: 'A', horario: '10:00', data: '31/02/2026' });
  assert.equal(e3.ok, false);
  assert.equal(e1.lista[0].data, '2026-10-28', 'lista original intacta');
});

test('cor automática com data: só a partir do dia e hora marcados, e continua verde depois', () => {
  const dia = (d, h, m) => new Date(2026, 9, d, h, m, 0);
  assert.equal(R.horarioAtingido('17:00', dia(27, 23, 0), '2026-10-28'), false, 'véspera, mesmo depois das 17h');
  assert.equal(R.horarioAtingido('17:00', dia(28, 16, 59), '2026-10-28'), false);
  assert.equal(R.horarioAtingido('17:00', dia(28, 17, 0), '2026-10-28'), true);
  assert.equal(R.horarioAtingido('17:00', dia(30, 8, 0), '2026-10-28'), true, 'dias depois continua verde');
  assert.equal(R.horarioAtingido('23:59', dia(27, 8, 0), '2026-10-26'), true, 'data passada vale mesmo que a hora ainda não tenha chegado hoje');
  assert.equal(R.horarioAtingido('17:00', new Date(2026, 11, 31, 23, 59), '2027-01-01'), false, 'virada de ano');
});

test('cor automática: data sem horário não destaca; sem data vale todo dia', () => {
  assert.equal(R.horarioAtingido('', new Date(2026, 9, 28, 12, 0), '2026-10-01'), false);
  assert.equal(R.horarioAtingido('17:00', new Date(2026, 9, 28, 18, 0), ''), true);
  assert.equal(R.horarioAtingido('17:00', new Date(2026, 9, 29, 8, 0), ''), false, 'sem data: recomeça no dia seguinte');
});

test('persistência: data é salva e registros antigos (sem data) continuam abrindo', () => {
  const arm = armazenamentoFalso();
  const r = R.criarRegistro({ nome: 'A', horario: '10:00', data: '28/10/2026' }, contador()).registro;
  R.salvar(arm, [r]);
  assert.equal(R.carregar(arm)[0].data, '2026-10-28');
  arm.setItem(R.CHAVE, JSON.stringify([{ id: 'x', nome: 'ANTIGO', projeto: '', horario: '10:00', estado: '' }]));
  const antigos = R.carregar(arm);
  assert.equal(antigos.length, 1);
  assert.match(antigos[0].data, /^\d{4}-\d{2}-\d{2}$/, 'registro antigo com horário e sem data ganha uma data');
});

test('edição: altera qualquer campo, inclusive limpando os opcionais', () => {
  const ids = contador();
  let lista = [
    R.criarRegistro({ nome: 'RAFAEL', projeto: 'PROJETO X', horario: '17:00', estado: 'OK' }, ids).registro,
    R.criarRegistro({ nome: 'SISTEMA' }, ids).registro,
  ];
  const e1 = R.editarRegistro(lista, 'id1', { nome: 'RAFAEL P.', projeto: '', horario: '', estado: '' });
  assert.equal(e1.ok, true);
  assert.deepEqual(e1.lista[0], { id: 'id1', nome: 'RAFAEL P.', projeto: '', horario: '', data: e1.lista[0].data, estado: '', obs: '' });
  assert.equal(lista[0].nome, 'RAFAEL', 'a lista original não pode mudar');
  assert.equal(e1.lista[1].nome, 'SISTEMA', 'os outros registros ficam iguais');

  const e2 = R.editarRegistro(e1.lista, 'id2', { nome: 'SISTEMA', projeto: 'Manutenção', horario: '20:00', estado: 'Aguardando' });
  assert.equal(e2.lista[1].horario, '20:00');
});

test('edição: editar não depende de horário nem estado atual, mas o nome segue obrigatório', () => {
  const ids = contador();
  const lista = [R.criarRegistro({ nome: 'A', horario: '08:00', estado: 'Concluído' }, ids).registro];
  assert.equal(R.horarioAtingido(lista[0].horario, hoje(23, 0)), true); // já está "verde"
  assert.equal(R.editarRegistro(lista, 'id1', { nome: 'B', estado: 'Outro' }).ok, true);
  assert.equal(R.editarRegistro(lista, 'id1', { nome: '  ' }).ok, false);
  assert.equal(R.editarRegistro(lista, 'inexistente', { nome: 'B' }).ok, false);
});

test('exclusão: remove só o registro certo e permite desfazer na mesma posição', () => {
  const ids = contador();
  const lista = ['A', 'B', 'C'].map((n) => R.criarRegistro({ nome: n }, ids).registro);
  const r = R.removerRegistro(lista, 'id2');
  assert.deepEqual(r.lista.map((x) => x.nome), ['A', 'C']);
  assert.equal(r.removido.nome, 'B');
  assert.equal(r.indice, 1);
  const volta = R.restaurarRegistro(r.lista, r.removido, r.indice);
  assert.deepEqual(volta.map((x) => x.nome), ['A', 'B', 'C']);
  assert.equal(R.restaurarRegistro(volta, r.removido, r.indice).length, 3, 'não duplica');
  assert.equal(R.removerRegistro(lista, 'nada').removido, null);
});

test('persistência: salvar e carregar devolvem os mesmos registros', () => {
  const arm = armazenamentoFalso();
  const ids = contador();
  const lista = [
    R.criarRegistro({ nome: 'RAFAEL', projeto: 'PROJETO X', horario: '17:00', estado: 'OK' }, ids).registro,
    R.criarRegistro({ nome: 'USUARIO123' }, ids).registro,
  ];
  assert.equal(R.salvar(arm, lista), true);
  assert.deepEqual(R.carregar(arm), lista);
});

test('persistência: dados vazios, estragados ou estranhos não quebram', () => {
  const arm = armazenamentoFalso();
  assert.deepEqual(R.carregar(arm), []);
  arm.setItem(R.CHAVE, '{isso não é json');
  assert.deepEqual(R.carregar(arm), []);
  arm.setItem(R.CHAVE, '{"a":1}');
  assert.deepEqual(R.carregar(arm), []);
  arm.setItem(R.CHAVE, JSON.stringify([null, 5, { nome: '' }, { nome: 'OK', horario: '99:99' }]));
  const lista = R.carregar(arm);
  assert.equal(lista.length, 1);
  assert.equal(lista[0].nome, 'OK');
  assert.equal(lista[0].horario, '');
});

test('persistência: armazenamento bloqueado devolve false em vez de travar', () => {
  const bloqueado = { setItem() { throw new Error('bloqueado'); }, getItem() { throw new Error('bloqueado'); } };
  assert.equal(R.salvar(bloqueado, []), false);
  assert.deepEqual(R.carregar(bloqueado), []);
});

test('cor automática: verde só a partir do horário (relógio local)', () => {
  assert.equal(R.horarioAtingido('17:00', hoje(16, 59)), false);
  assert.equal(R.horarioAtingido('17:00', hoje(17, 0)), true);
  assert.equal(R.horarioAtingido('17:00', hoje(17, 1)), true);
  assert.equal(R.horarioAtingido('17:00', hoje(23, 59)), true);
});

test('cor automática: sem horário nunca destaca', () => {
  assert.equal(R.horarioAtingido('', hoje(12, 0)), false);
  assert.equal(R.horarioAtingido(undefined, hoje(12, 0)), false);
});

test('cor automática: ao mudar o horário, o destaque é recalculado', () => {
  const agora = hoje(18, 0);
  assert.equal(R.horarioAtingido('17:00', agora), true);
  assert.equal(R.horarioAtingido('20:00', agora), false); // horário movido para o futuro
  assert.equal(R.horarioAtingido('00:00', hoje(0, 0)), true); // meia-noite exata
  assert.equal(R.horarioAtingido('17:00', hoje(0, 0)), false); // o dia recomeça à meia-noite
});

test('cor automática não altera o estado digitado pelo usuário', () => {
  const r = R.criarRegistro({ nome: 'A', horario: '10:00', estado: 'Em análise' }, contador()).registro;
  const antes = JSON.stringify(r);
  R.horarioAtingido(r.horario, hoje(12, 0));
  assert.equal(JSON.stringify(r), antes);
  assert.equal(r.estado, 'Em análise');
});

// ---------- horário só com a hora, data só com o dia, observação ----------
const HOJE = new Date(2026, 9, 27, 19, 13, 0); // 27/10/2026

test('horário: só a hora vale (19 = 19:00, 9 = 09:00)', () => {
  assert.equal(R.normalizarHorario('19'), '19:00');
  assert.equal(R.normalizarHorario('9'), '09:00');
  assert.equal(R.normalizarHorario('0'), '00:00');
  assert.equal(R.normalizarHorario('19:30'), '19:30');
  assert.equal(R.normalizarHorario('9:05'), '09:05');
  ['24', '25', '19:', '19:3', '19:60', 'abc', '1930', ''].forEach((v) => {
    assert.equal(R.normalizarHorario(v), '', v);
  });
  assert.equal(R.criarRegistro({ nome: 'A', horario: '19' }, contador()).registro.horario, '19:00');
  assert.deepEqual(R.criarRegistro({ nome: 'A', horario: '24' }).erros, ['horario-invalido']);
});

test('data: só o dia vale (27 = dia 27 do mês e ano atuais)', () => {
  assert.equal(R.normalizarData('27', HOJE), '2026-10-27');
  assert.equal(R.normalizarData('5', HOJE), '2026-10-05');
  assert.equal(R.normalizarData('05', HOJE), '2026-10-05');
});

test('data: dia e mês valem (mês pode ser outro; ano é opcional)', () => {
  assert.equal(R.normalizarData('27/11', HOJE), '2026-11-27');
  assert.equal(R.normalizarData('3/1', HOJE), '2026-01-03');
  assert.equal(R.normalizarData('27/10/2027', HOJE), '2027-10-27');
  assert.equal(R.normalizarData('2026-10-27', HOJE), '2026-10-27');
});

test('data: o mês muda o que "só o dia" significa, e dia que não existe é recusado', () => {
  assert.equal(R.normalizarData('31', new Date(2026, 9, 1)), '2026-10-31');
  assert.equal(R.normalizarData('31', new Date(2026, 10, 1)), '', 'novembro não tem dia 31');
  assert.equal(R.normalizarData('31/11', HOJE), '');
  assert.equal(R.normalizarData('29/02', new Date(2027, 0, 1)), '');
  assert.equal(R.normalizarData('29/02', new Date(2028, 0, 1)), '2028-02-29');
  ['0', '32', '27/0', '27/13', '1/2/3', '27/10/', '/10', 'abc'].forEach((v) => {
    assert.equal(R.normalizarData(v, HOJE), '', v);
  });
});

test('data: cadastro e edição usam a data de hoje para completar mês e ano', () => {
  const r = R.criarRegistro({ nome: 'A', data: '27' }, contador(), HOJE);
  assert.equal(r.registro.data, '2026-10-27');
  const e = R.editarRegistro([r.registro], 'id1', { nome: 'A', data: '5/12' }, HOJE);
  assert.equal(e.lista[0].data, '2026-12-05');
  assert.deepEqual(R.criarRegistro({ nome: 'A', data: '31/11' }, undefined, HOJE).erros, ['data-invalida']);
});

test('data: na tela o ano só aparece quando não é o ano atual', () => {
  assert.equal(R.dataParaTela('2026-10-27', HOJE), '27/10');
  assert.equal(R.dataParaTela('2027-01-05', HOJE), '05/01/2027');
  assert.equal(R.dataParaTela('2026-10-27'), '27/10/2026', 'sem "agora": completa');
  // o que aparece na tela volta a ser a mesma data quando digitado de novo
  assert.equal(R.normalizarData(R.dataParaTela('2026-10-27', HOJE), HOJE), '2026-10-27');
});

test('observação: opcional, guardada com limite maior e vazia por padrão', () => {
  assert.equal(R.criarRegistro({ nome: 'A' }, contador()).registro.obs, '');
  assert.equal(R.criarRegistro({ nome: 'A', obs: '  ligar antes  ' }, contador()).registro.obs, 'ligar antes');
  const longa = 'x'.repeat(500);
  assert.equal(R.criarRegistro({ nome: 'A', obs: longa }, contador()).registro.obs.length, R.LIMITE_OBS);
  assert.equal(R.criarRegistro({ nome: 'A', obs: 5 }, contador()).registro.obs, '', 'tipo errado não quebra');
});

test('observação: pode ser editada e removida; registros antigos (sem obs) abrem normal', () => {
  const ids = contador();
  const lista = [R.criarRegistro({ nome: 'A', obs: 'primeira' }, ids).registro];
  const e1 = R.editarRegistro(lista, 'id1', { nome: 'A', obs: 'segunda' });
  assert.equal(e1.lista[0].obs, 'segunda');
  assert.equal(R.editarRegistro(e1.lista, 'id1', { nome: 'A', obs: '' }).lista[0].obs, '');
  const arm = armazenamentoFalso();
  R.salvar(arm, e1.lista);
  assert.equal(R.carregar(arm)[0].obs, 'segunda');
  arm.setItem(R.CHAVE, JSON.stringify([{ id: 'x', nome: 'ANTIGO', horario: '10:00', data: '2026-10-27' }]));
  assert.equal(R.carregar(arm)[0].obs, '');
});

test('cor automática: horário só com a hora funciona (19 -> 19:00)', () => {
  const h = R.normalizarHorario('19');
  assert.equal(R.horarioAtingido(h, new Date(2026, 9, 27, 18, 59)), false);
  assert.equal(R.horarioAtingido(h, new Date(2026, 9, 27, 19, 0)), true);
  assert.equal(R.horarioAtingido('19', new Date(2026, 9, 27, 19, 0)), true, 'aceita direto também');
});

// ---------- ordem e limpeza de dados vindos de fora ----------
test('ordem: edição preserva o campo ordem; ordenar não altera a lista original', () => {
  const lista = [{ id: 'b', nome: 'B', ordem: 2 }, { id: 'a', nome: 'A', ordem: 2 }, { id: 'c', nome: 'C', ordem: 1 }]
    .map((r) => Object.assign({ projeto: '', horario: '', data: '', estado: '', obs: '' }, r));
  const e = R.editarRegistro(lista, 'b', { nome: 'B2' });
  assert.equal(e.lista[0].ordem, 2, 'edição não muda a ordem de criação');
  R.ordenar(lista);
  assert.equal(lista[0].nome, 'B', 'ordenar não altera a lista original');
});

test('estado: LIVRE e OK são reconhecidos sem olhar maiúscula, acento ou espaço sobrando', () => {
  ['livre', 'LIVRE', ' Livre ', 'lívre'].forEach((v) => assert.equal(R.tipoEstado(v), 'livre', v));
  ['ok', 'OK', ' Ok ', 'oK'].forEach((v) => assert.equal(R.tipoEstado(v), 'ok', v));
  ['', 'não livre', 'livre agora', 'ok!', 'okay', 'pendente', undefined, null].forEach((v) => assert.equal(R.tipoEstado(v), '', String(v)));
});

test('ordenar: alfabética pelo nome, ignorando maiúscula e acento; números na ordem natural', () => {
  const mk = (id, nome, estado, ordem) => ({ id, nome, estado: estado || '', ordem: ordem || 1 });
  const lista = [mk('1', 'bia'), mk('2', 'Ágata'), mk('3', 'Abel'), mk('4', 'Zé'), mk('5', 'cris'), mk('6', 'Item 10'), mk('7', 'Item 2')];
  assert.deepEqual(R.ordenar(lista).map((r) => r.nome), ['Abel', 'Ágata', 'bia', 'cris', 'Item 2', 'Item 10', 'Zé']);
});

test('ordenar: LIVRE primeiro, depois OK, depois os demais (cada grupo em ordem alfabética)', () => {
  const mk = (id, nome, estado) => ({ id, nome, estado, ordem: 1 });
  const lista = [mk('1', 'Ana', 'livre'), mk('2', 'Zeca', 'OK'), mk('3', 'Bia', ''), mk('4', 'Caio', 'ok'), mk('5', 'Abel', 'Pendente'), mk('6', 'Duda', 'LIVRE')];
  assert.deepEqual(R.ordenar(lista).map((r) => r.nome), ['Ana', 'Duda', 'Caio', 'Zeca', 'Abel', 'Bia']);
});

test('ordenar: nomes iguais desempatam pela ordem de criação e depois pelo id (estável entre aparelhos)', () => {
  const mk = (id, ordem) => ({ id, nome: 'Ana', estado: '', ordem });
  assert.deepEqual(R.ordenar([mk('b', 2), mk('a', 2), mk('c', 1)]).map((r) => r.id), ['c', 'a', 'b']);
});

test('ordem: registros antigos sem ordem ganham uma pela posição; os que têm ficam como estão', () => {
  const r = R.garantirOrdem([{ id: 'x', nome: 'X' }, { id: 'y', nome: 'Y', ordem: 99 }, { id: 'z', nome: 'Z' }]);
  assert.deepEqual(r.map((v) => v.ordem), [1, 99, 3]);
});

test('ordem: desfazer exclusão volta ao mesmo lugar mesmo depois de ordenar', () => {
  const lista = [1, 2, 3].map((n) => ({ id: 'id' + n, nome: 'N' + n, projeto: '', horario: '', data: '', estado: '', obs: '', ordem: n * 10 }));
  const r = R.removerRegistro(lista, 'id2');
  const volta = R.ordenar(R.restaurarRegistro(r.lista, r.removido, r.indice));
  assert.deepEqual(volta.map((v) => v.id), ['id1', 'id2', 'id3']);
});

test('sanear: ignora lixo, exige nome, corrige campos e evita ids repetidos', () => {
  const r = R.sanearLista([null, 5, 'x', { nome: '' }, { id: 'a', nome: 'A', horario: '25' }, { id: 'a', nome: 'B' }, { nome: 'C', ordem: 'abc' }]);
  assert.equal(r.length, 3);
  assert.equal(r[0].horario, '', 'horário inválido de fora vira vazio');
  assert.notEqual(r[0].id, r[1].id, 'id repetido é trocado');
  assert.equal(r[2].ordem, undefined, 'ordem que não é número é descartada');
  assert.deepEqual(R.sanearLista('texto'), []);
  assert.deepEqual(R.sanearLista(undefined), []);
});

// ---------- nome único, nome com maiúscula, estado LIVRE/OK padronizado ----------
const um = (dados, lista) => R.criarRegistro(dados, () => 'id' + Math.random(), HOJE, lista);

test('nome: a primeira letra é sempre maiúscula; o resto não é mexido', () => {
  assert.equal(um({ nome: 'ana' }).registro.nome, 'Ana');
  assert.equal(um({ nome: '  joão da silva ' }).registro.nome, 'João da silva');
  assert.equal(um({ nome: 'ébano' }).registro.nome, 'Ébano');
  assert.equal(um({ nome: 'Ra2019' }).registro.nome, 'Ra2019');
  assert.equal(um({ nome: '2019x' }).registro.nome, '2019x', 'começando por número não muda');
  assert.equal(um({ nome: 'iPhone' }).registro.nome, 'IPhone');
  assert.equal(R.capitalizarNome(''), '');
});

test('nome: não pode repetir (ignora maiúscula, acento e espaços); projeto, horário e estado podem', () => {
  const a = um({ nome: 'Ana', projeto: 'P', horario: '19', estado: 'Pendente' }).registro;
  const lista = [a];
  ['Ana', 'ana', ' ANA ', 'Aná'].forEach((n) => {
    const r = um({ nome: n }, lista);
    assert.equal(r.ok, false, n);
    assert.deepEqual(r.erros, ['nome-duplicado']);
  });
  assert.equal(um({ nome: 'Ana Maria' }, lista).ok, true, 'parecido não é igual');
  assert.equal(um({ nome: 'Bia', projeto: 'P', horario: '19', estado: 'Pendente' }, lista).ok, true, 'o resto pode repetir');
  assert.equal(um({ nome: 'Ana' }).ok, true, 'sem lista, não há como comparar');
});

test('nome: na edição, o próprio registro não conta; trocar para o nome de outro é recusado', () => {
  const lista = [um({ nome: 'Ana' }).registro, um({ nome: 'Bia' }).registro];
  const [a, b] = lista;
  assert.equal(R.editarRegistro(lista, a.id, { nome: 'ana', projeto: 'X' }, HOJE).ok, true, 'mesmo nome (até em minúscula) no próprio registro');
  const r = R.editarRegistro(lista, a.id, { nome: 'bia' }, HOJE);
  assert.equal(r.ok, false);
  assert.deepEqual(r.erros, ['nome-duplicado']);
  assert.equal(R.editarRegistro(lista, b.id, { nome: 'Carla' }, HOJE).ok, true);
});

test('nome: dados antigos com nome repetido continuam editáveis se o nome não mudar', () => {
  const lista = [{ id: 'x', nome: 'Ana' }, { id: 'y', nome: 'Ana' }].map((r) => Object.assign({ projeto: '', horario: '', data: '', estado: '', obs: '' }, r));
  assert.equal(R.editarRegistro(lista, 'x', { nome: 'Ana', obs: 'ok' }, HOJE).ok, true);
  assert.equal(R.editarRegistro(lista, 'x', { nome: 'Ana', estado: 'livre' }, HOJE).ok, true);
});

test('nome: desfazer exclusão não recria um nome que já foi usado depois', () => {
  const a = um({ nome: 'Ana' }).registro;
  const r = R.removerRegistro([a], a.id);
  const outra = um({ nome: 'ana' }, r.lista).registro;
  const volta = R.restaurarRegistro([outra], r.removido, 0);
  assert.deepEqual(volta, [outra], 'não restaura: já existe uma Ana');
});

test('estado: livre e ok viram LIVRE e OK, de qualquer jeito que forem digitados; outros ficam iguais', () => {
  assert.equal(um({ nome: 'A', estado: 'livre' }).registro.estado, 'LIVRE');
  assert.equal(um({ nome: 'A', estado: ' Livre ' }).registro.estado, 'LIVRE');
  assert.equal(um({ nome: 'A', estado: 'lÍvre' }).registro.estado, 'LIVRE');
  assert.equal(um({ nome: 'A', estado: 'oK' }).registro.estado, 'OK');
  assert.equal(um({ nome: 'A', estado: 'ok sim' }).registro.estado, 'ok sim');
  assert.equal(um({ nome: 'A', estado: 'não livre' }).registro.estado, 'não livre');
  assert.equal(um({ nome: 'A', estado: 'Pendente' }).registro.estado, 'Pendente');
  const lista = [um({ nome: 'A' }).registro];
  assert.equal(R.editarRegistro(lista, lista[0].id, { nome: 'A', estado: 'ok' }, HOJE).registro.estado, 'OK');
});

test('dados antigos: ao carregar, nome vira com maiúscula e livre/ok viram LIVRE/OK', () => {
  const r = R.sanearLista([{ id: 'a', nome: 'ana', estado: 'livre' }, { id: 'b', nome: 'bia', estado: 'Ok' }, { id: 'c', nome: 'caio', estado: 'ok?' }]);
  assert.deepEqual(r.map((x) => [x.nome, x.estado]), [['Ana', 'LIVRE'], ['Bia', 'OK'], ['Caio', 'ok?']]);
});

// ---------- ordenar por horário ----------
test('ordenar por horário: do menor para o maior; sem horário vai para o fim, em ordem alfabética', () => {
  const mk = (id, nome, horario, extra) => Object.assign({ id, nome, horario, data: '', estado: '', ordem: 1 }, extra);
  const lista = [mk('1', 'Ana', '19:00'), mk('2', 'Bia', ''), mk('3', 'Caio', '08:30'), mk('4', 'Abel', ''), mk('5', 'Duda', '08:05'), mk('6', 'Eva', '23:59'), mk('7', 'Zé', '00:00')];
  assert.deepEqual(R.ordenar(lista, 'horario').map((r) => r.nome), ['Zé', 'Duda', 'Caio', 'Ana', 'Eva', 'Abel', 'Bia']);
});

test('ordenar por horário: LIVRE, depois OK, depois os demais; cada grupo por horário', () => {
  const mk = (id, nome, horario, estado) => ({ id, nome, horario, data: '', estado, ordem: 1 });
  const lista = [mk('1', 'Ana', '08:00', ''), mk('2', 'Bia', '20:00', 'LIVRE'), mk('3', 'Caio', '07:00', 'ok'), mk('4', 'Duda', '', 'OK'), mk('5', 'Eva', '06:00', 'x')];
  assert.deepEqual(R.ordenar(lista, 'horario').map((r) => r.nome), ['Bia', 'Caio', 'Duda', 'Eva', 'Ana']);
});

test('ordenar por horário: mesmo horário o dia manda (sem data por último) e depois o nome', () => {
  const mk = (id, nome, data) => ({ id, nome, horario: '19:00', data, estado: '', ordem: 1 });
  const lista = [mk('1', 'Zeca', '2026-11-05'), mk('2', 'Bia', ''), mk('3', 'Ana', '2026-11-05'), mk('4', 'Caio', '2026-10-30')];
  assert.deepEqual(R.ordenar(lista, 'horario').map((r) => r.nome), ['Caio', 'Ana', 'Zeca', 'Bia']);
});

test('ordenar: sem modo, ou modo desconhecido, é alfabética; ordenar não altera a lista original', () => {
  const lista = [{ id: '1', nome: 'B', horario: '08:00' }, { id: '2', nome: 'A', horario: '09:00' }];
  assert.deepEqual(R.ordenar(lista).map((r) => r.nome), ['A', 'B']);
  assert.deepEqual(R.ordenar(lista, 'xis').map((r) => r.nome), ['A', 'B']);
  assert.deepEqual(R.ordenar(lista, 'horario').map((r) => r.nome), ['B', 'A']);
  assert.equal(lista[0].nome, 'B');
});

// ---------- data automática (hoje) quando há horário e não há data ----------
const em2 = (d, h, m, s) => new Date(2026, 9, d, h, m || 0, s || 0);

test('data é obrigatória e automática: sem data, vale a próxima vez que o horário acontece', () => {
  const nova = (h, agora) => R.criarRegistro({ nome: 'Ana', horario: h }, contador(), agora).registro.data;
  assert.equal(nova('9:40', em2(29, 4, 50)), '2026-10-29', 'ainda vai chegar hoje');
  assert.equal(nova('22', em2(29, 20, 10)), '2026-10-29');
  assert.equal(nova('0', em2(29, 20, 10)), '2026-10-30', '00h às 20:10 é amanhã');
  assert.equal(nova('18', em2(29, 20, 10)), '2026-10-30', '18h já passou hoje: próxima é amanhã');
  assert.equal(nova('20:10', em2(29, 20, 10, 40)), '2026-10-29', 'mesmo minuto: ainda hoje');
  assert.equal(nova('', em2(29, 20, 10)), '2026-10-29', 'sem horário: hoje');
  assert.equal(nova('0', new Date(2026, 11, 31, 20, 0)), '2027-01-01', 'virada de ano');
  const t = R.criarRegistro({ nome: 'Cai', horario: '10', data: '30/10' }, contador(), em2(29, 4, 50)).registro;
  assert.equal(t.data, '2026-10-30', 'data digitada é respeitada');
});

test('com a data automática, o registro só fica atingido quando a hora chega', () => {
  const r = R.criarRegistro({ nome: 'Ana', horario: '1' }, contador(), em2(28, 21, 30)).registro;
  assert.equal(r.data, '2026-10-29');
  assert.equal(R.horarioAtingido(r.horario, em2(28, 21, 31), r.data), false);
  assert.equal(R.horarioAtingido(r.horario, em2(29, 0, 59), r.data), false);
  assert.equal(R.horarioAtingido(r.horario, em2(29, 1, 0), r.data), true);
});

test('editar o horário NÃO troca a data em silêncio; data apagada volta a ser automática', () => {
  const agora = em2(29, 20, 17);
  const base = R.criarRegistro({ nome: 'Ana', horario: '22', data: '30/10' }, contador(), agora).registro;
  assert.equal(base.data, '2026-10-30');
  const ed = (dados) => R.editarRegistro([base], base.id, Object.assign({ nome: 'Ana', data: '30/10/2026' }, dados), agora).registro;
  assert.equal(ed({ horario: '21' }).data, '2026-10-30', 'a data continua a mesma');
  assert.equal(ed({ horario: '21', data: '29/10/2026' }).data, '2026-10-29', 'o usuário pode mover para o dia 29');
  assert.equal(ed({ horario: '21', data: '' }).data, '2026-10-29', 'data apagada: próxima vez do horário');
  assert.equal(ed({ projeto: 'X', horario: '22' }).data, '2026-10-30');
});

test('proximaData: sugestão usada na pergunta ao editar o horário', () => {
  assert.equal(R.proximaData('21:00', em2(29, 20, 17)), '2026-10-29');
  assert.equal(R.proximaData('00:00', em2(29, 20, 17)), '2026-10-30');
});

test('ordenar por horário: o menor dia fica em cima; no mesmo dia, o menor horário', () => {
  const l = [
    { id: '1', nome: 'D30-08', horario: '08:00', data: '2026-10-30', estado: '' },
    { id: '2', nome: 'D29-23', horario: '23:00', data: '2026-10-29', estado: '' },
    { id: '3', nome: 'D29-10', horario: '10:00', data: '2026-10-29', estado: '' },
    { id: '4', nome: 'Sem', horario: '', data: '2026-10-29', estado: '' },
  ];
  assert.deepEqual(R.ordenar(l, 'horario').map((r) => r.nome), ['D29-10', 'D29-23', 'D30-08', 'Sem']);
  l.push({ id: '5', nome: 'Livre30', horario: '22:00', data: '2026-10-30', estado: 'LIVRE' });
  assert.equal(R.ordenar(l, 'horario')[0].nome, 'Livre30', 'LIVRE continua acima de tudo');
});

test('registro antigo com horário e sem data: ganha a data da próxima ocorrência após criado', () => {
  const criado = em2(28, 21, 30).getTime();
  const lista = R.sanearLista([{ id: 'a', nome: 'Ana', horario: '01:00', estado: '', ordem: criado }]);
  assert.equal(lista[0].data, '2026-10-29');
  const sem = R.sanearLista([{ id: 'b', nome: 'Bia', horario: '01:00', estado: '', ordem: 3 }]);
  assert.match(sem[0].data, /^\d{4}-\d{2}-\d{2}$/);
});

test('proximaOrdem: sempre maior que as existentes e que o agora', () => {
  const agora = em2(29, 4, 50);
  assert.equal(R.proximaOrdem([], agora), agora.getTime());
  assert.equal(R.proximaOrdem([{ ordem: agora.getTime() }], agora), agora.getTime() + 1);
  assert.equal(R.proximaOrdem([{ ordem: 5 }], agora), agora.getTime());
});
