// Testes das anotações de cada registro. Rode com: node --test testes-anotacoes.js
const test = require('node:test');
const assert = require('node:assert/strict');
const N = require('../js/core/anotacoes.js');

const quando = (h, m) => new Date(2026, 9, 30, h, m || 0, 0);
const ids = () => { let i = 0; return () => 'n' + (++i); };

test('criar: exige registro e texto; limite de tamanho', () => {
  assert.deepEqual(N.criar([], { registroId: '', texto: 'x' }, quando(10)).erros, ['registro-vazio']);
  assert.deepEqual(N.criar([], { registroId: 'r1', texto: '   ' }, quando(10)).erros, ['texto-vazio']);
  assert.deepEqual(N.criar([], { registroId: 'r1', texto: 'a'.repeat(1001) }, quando(10)).erros, ['texto-longo']);
  assert.equal(N.criar([], { registroId: 'r1', texto: 'a'.repeat(1000) }, quando(10)).ok, true);
});

test('criar: a mais nova vai primeiro; texto limpo, quebras de linha ficam; lista original intacta', () => {
  const g = ids();
  const a = N.criar([], { registroId: 'r1', texto: ' acabou o token\r\nfalar com o X \n' }, quando(10), g);
  assert.equal(a.anotacao.texto, 'acabou o token\nfalar com o X');
  assert.equal(a.anotacao.t, quando(10).getTime());
  const b = N.criar(a.lista, { registroId: 'r2', texto: 'outra' }, quando(11), g);
  assert.deepEqual(b.lista.map((x) => x.registroId), ['r2', 'r1']);
  assert.equal(a.lista.length, 1);
});

test('criar: no máximo 300 no total; as mais antigas saem', () => {
  const g = ids();
  let l = [];
  for (let i = 0; i < 305; i++) l = N.criar(l, { registroId: 'r1', texto: 'n' + i }, quando(10), g).lista;
  assert.equal(l.length, 300);
  assert.equal(l[0].texto, 'n304');
});

test('cada registro enxerga só as suas anotações (doRegistro, contar, filtrar)', () => {
  const g = ids();
  let l = [];
  l = N.criar(l, { registroId: 'ana', texto: 'Acabou o token' }, quando(10), g).lista;
  l = N.criar(l, { registroId: 'bia', texto: 'Trocar domínio do token' }, quando(11), g).lista;
  l = N.criar(l, { registroId: 'ana', texto: 'Falar com o Édson' }, quando(12), g).lista;
  assert.equal(N.contar(l, 'ana'), 2);
  assert.equal(N.contar(l, 'bia'), 1);
  assert.equal(N.contar(l, 'zeca'), 0);
  assert.deepEqual(N.doRegistro(l, 'ana').map((a) => a.texto), ['Falar com o Édson', 'Acabou o token']);
  assert.equal(N.filtrar(l, 'ana', 'token').length, 1, 'busca só dentro do registro');
  assert.equal(N.filtrar(l, 'ana', 'edson').length, 1, 'sem acento');
  assert.equal(N.filtrar(l, 'ana', 'token edson').length, 0, 'todas as palavras na mesma anotação');
  assert.equal(N.filtrar(l, 'ana', '').length, 2);
});

test('editar: só o texto muda; guarda criada e editada; sem mudança não marca', () => {
  const l = N.criar([], { registroId: 'r1', texto: 'um' }, quando(10), ids()).lista;
  const e = N.editar(l, 'n1', { texto: 'dois' }, quando(12));
  assert.equal(e.anotacao.texto, 'dois');
  assert.equal(e.anotacao.registroId, 'r1');
  assert.equal(e.anotacao.t, quando(10).getTime());
  assert.equal(e.anotacao.editada, quando(12).getTime());
  assert.equal(l[0].texto, 'um');
  assert.equal(N.editar(e.lista, 'n1', { texto: 'dois' }, quando(15)).anotacao.editada, quando(12).getTime());
  assert.deepEqual(N.editar(l, 'n1', { texto: ' ' }, quando(12)).erros, ['texto-vazio']);
  assert.deepEqual(N.editar(l, 'zzz', { texto: 'a' }, quando(12)).erros, ['nao-encontrada']);
});

test('remover: tira só a escolhida; devolve a mesma lista se não achar', () => {
  const g = ids();
  let l = N.criar([], { registroId: 'r1', texto: 'um' }, quando(10), g).lista;
  l = N.criar(l, { registroId: 'r1', texto: 'um' }, quando(11), g).lista;
  assert.deepEqual(N.remover(l, 'n1').map((a) => a.id), ['n2']);
  assert.equal(N.remover(l, 'nada'), l);
});

test('excluir um registro leva as anotações dele; desfazer devolve (sem duplicar)', () => {
  const g = ids();
  let l = [];
  l = N.criar(l, { registroId: 'ana', texto: 'a1' }, quando(10), g).lista;
  l = N.criar(l, { registroId: 'bia', texto: 'b1' }, quando(11), g).lista;
  l = N.criar(l, { registroId: 'ana', texto: 'a2' }, quando(12), g).lista;
  const r = N.removerDoRegistro(l, 'ana');
  assert.deepEqual(r.lista.map((a) => a.texto), ['b1']);
  assert.deepEqual(r.removidas.map((a) => a.texto), ['a2', 'a1']);
  assert.equal(N.removerDoRegistro(l, 'nada').lista, l, 'nada a tirar: mesma lista');
  const volta = N.devolver(r.lista, r.removidas);
  assert.deepEqual(volta.map((a) => a.texto), ['a2', 'b1', 'a1'], 'volta na ordem de criação');
  assert.equal(N.devolver(volta, r.removidas).length, 3, 'devolver duas vezes não duplica');
  assert.equal(N.devolver(volta, []), volta);
});

test('sanear/carregar/salvar: lixo e anotações sem registro são ignorados; ordem da mais nova para a mais antiga', () => {
  const arm = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; })();
  assert.deepEqual(N.carregar(arm), []);
  arm.setItem(N.CHAVE, '{lixo');
  assert.deepEqual(N.carregar(arm), []);
  const bruta = [null, 5, { registroId: '', texto: 'x' }, { registroId: 'r', texto: '' }, { projeto: 'P', texto: 'versão antiga, sem registro' },
    { id: 'a', registroId: 'r', texto: 'velha', t: 1 }, { id: 'a', registroId: 'r', texto: 'nova', t: 9 }];
  const l = N.sanear(bruta);
  assert.deepEqual(l.map((x) => x.texto), ['nova', 'velha']);
  assert.notEqual(l[0].id, l[1].id);
  assert.equal(N.salvar(arm, l), true);
  assert.deepEqual(N.carregar(arm), l);
  assert.equal(N.salvar({ setItem() { throw new Error('x'); } }, l), false);
  assert.equal(N.CHAVE, 'registros:anotacoes:v2', 'chave nova: a versão antiga (por projeto) não é lida nem apagada');
});
