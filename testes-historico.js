const test = require('node:test');
const assert = require('node:assert');
const H = require('./historico.js');

const memoria = (inicial) => { const m = new Map(inicial || []); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; };
const agora = new Date(2026, 9, 28, 12, 0, 0); // 28/10/2026 12:00
const dia = (d, h = 10) => new Date(2026, 9, d, h, 0, 0).getTime();
const e = (tipo, nome, t, extra) => Object.assign({ t, tipo, id: nome, nome, mudancas: [] }, extra);

test('adicionar põe a entrada mais nova primeiro e não altera a lista original', () => {
  const a = H.adicionar([], e('criado', 'A', 1));
  const b = H.adicionar(a, e('editado', 'A', 2));
  assert.deepStrictEqual(b.map((x) => x.tipo), ['editado', 'criado']);
  assert.strictEqual(a.length, 1);
});

test('limite de 500: as mais antigas saem', () => {
  let l = [];
  for (let i = 0; i < 505; i++) l = H.adicionar(l, e('criado', 'N' + i, i));
  assert.strictEqual(l.length, 500);
  assert.strictEqual(l[0].nome, 'N504');
  assert.strictEqual(l[499].nome, 'N5');
});

test('entrada inválida é ignorada', () => {
  assert.deepStrictEqual(H.adicionar([], { tipo: 'xis', t: 1 }), []);
  assert.deepStrictEqual(H.adicionar([], null), []);
  assert.deepStrictEqual(H.adicionar([], { tipo: 'criado', t: 'ontem' }), []);
});

test('diferencas lista só o que mudou', () => {
  const d = H.diferencas({ nome: 'A', projeto: 'P', horario: '19:00', data: '', estado: '', obs: '' },
                         { nome: 'A', projeto: 'Q', horario: '20:00', data: '', estado: '', obs: '' });
  assert.deepStrictEqual(d, [{ campo: 'projeto', de: 'P', para: 'Q' }, { campo: 'horario', de: '19:00', para: '20:00' }]);
  assert.deepStrictEqual(H.diferencas({ nome: 'A' }, { nome: 'A' }), []);
});

test('salvar e carregar; dados corrompidos viram lista vazia', () => {
  const m = memoria();
  H.salvar(m, H.adicionar([], e('criado', 'A', 5)));
  assert.strictEqual(H.carregar(m).length, 1);
  assert.deepStrictEqual(H.carregar(memoria([[H.CHAVE, 'lixo{']])), []);
  assert.deepStrictEqual(H.carregar(memoria([[H.CHAVE, '{"a":1}']])), []);
});

test('sanear descarta itens ruins, ordena e aceita campos faltando', () => {
  const l = H.sanear([e('criado', 'A', 1), 7, { tipo: 'criado' }, { t: 9, tipo: 'excluido', nome: 'B' }]);
  assert.deepStrictEqual(l.map((x) => x.nome), ['B', 'A']);
  assert.deepStrictEqual(l[0].mudancas, []);
});

const base = [
  e('criado', 'Reunião', dia(28, 9)),
  e('editado', 'Ação Ótima', dia(27), { mudancas: [{ campo: 'horario', de: '19:00', para: '20:00' }] }),
  e('excluido', 'Velho', dia(22)),
  e('atingido', 'Reunião', dia(1)),
];

test('filtro por tipo', () => {
  assert.strictEqual(H.filtrar(base, { tipo: 'excluido' }, agora).length, 1);
  assert.strictEqual(H.filtrar(base, { tipo: 'todos' }, agora).length, 4);
});

test('filtro por período', () => {
  assert.deepStrictEqual(H.filtrar(base, { periodo: 'hoje' }, agora).map((x) => x.nome), ['Reunião']);
  assert.strictEqual(H.filtrar(base, { periodo: '7d' }, agora).length, 3);
  assert.strictEqual(H.filtrar(base, { periodo: '30d' }, agora).length, 4);
  assert.strictEqual(H.filtrar(base, { periodo: 'tudo' }, agora).length, 4);
});

test('busca ignora maiúsculas e acentos e olha nome e mudanças', () => {
  assert.deepStrictEqual(H.filtrar(base, { texto: 'acao otima' }, agora).map((x) => x.nome), ['Ação Ótima']);
  assert.strictEqual(H.filtrar(base, { texto: 'REUNIAO' }, agora).length, 2);
  assert.strictEqual(H.filtrar(base, { texto: '20:00' }, agora).length, 1);
  assert.strictEqual(H.filtrar(base, { texto: 'nada disso' }, agora).length, 0);
});

test('filtros combinam', () => {
  assert.strictEqual(H.filtrar(base, { tipo: 'atingido', periodo: 'hoje', texto: '' }, agora).length, 0);
  assert.strictEqual(H.filtrar(base, { tipo: 'criado', texto: 'reuni' }, agora).length, 1);
});
