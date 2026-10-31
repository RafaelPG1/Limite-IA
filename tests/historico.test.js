const test = require('node:test');
const assert = require('node:assert');
const H = require('../js/core/historico.js');

const memoria = (inicial) => { const m = new Map(inicial || []); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; };
const dia = (d, h = 10) => new Date(2026, 9, d, h, 0, 0).getTime();
const e = (tipo, nome, t, extra) => Object.assign({ t, tipo, id: nome, nome, projeto: '', horario: '', data: '', estado: '', obs: '', mudancas: [] }, extra);

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
  e('criado', 'Reunião', dia(28, 9), { projeto: 'Loja Nova', horario: '19:00', data: '2026-10-27', estado: 'Pendente', obs: 'ligar para o Carlos' }),
  e('editado', 'Ação Ótima', dia(27), { projeto: 'Casa', mudancas: [{ campo: 'horario', de: '19:00', para: '20:00' }] }),
  e('excluido', 'Velho', dia(22), { projeto: 'Loja Antiga', estado: 'Feito' }),
  e('atingido', 'Reunião', dia(1), { projeto: 'Loja Nova' }),
];
const nomes = (l) => l.map((x) => x.nome);

test('campo Nome filtra só pelo nome (sem acento e maiúscula)', () => {
  assert.deepStrictEqual(nomes(H.filtrar(base, { nome: 'acao' })), ['Ação Ótima']);
  assert.strictEqual(H.filtrar(base, { nome: 'REUNIAO' }).length, 2);
  assert.strictEqual(H.filtrar(base, { nome: 'loja' }).length, 0, 'projeto não conta no campo Nome');
});

test('campo Projeto filtra só pelo projeto', () => {
  assert.strictEqual(H.filtrar(base, { projeto: 'loja nova' }).length, 2);
  assert.deepStrictEqual(nomes(H.filtrar(base, { projeto: 'casa' })), ['Ação Ótima']);
  assert.strictEqual(H.filtrar(base, { projeto: 'reuniao' }).length, 0, 'nome não conta no campo Projeto');
});

test('Buscar acha o termo em qualquer canto: nome, projeto, estado, obs, horário, data, tipo, mudanças', () => {
  const acha = (txt) => H.filtrar(base, { texto: txt }).length;
  assert.strictEqual(acha('Reunião'), 2);        // nome
  assert.strictEqual(acha('loja'), 3);           // projeto
  assert.strictEqual(acha('pendente'), 1);       // estado
  assert.strictEqual(acha('carlos'), 1);         // observação
  assert.strictEqual(acha('19:00'), 2);          // horário e mudança "de"
  assert.strictEqual(acha('20:00'), 1);          // mudança "para"
  assert.strictEqual(acha('27/10'), 2);          // data do registro (Reunião) e dia em que a edição aconteceu
  assert.strictEqual(acha('excluido'), 1);       // tipo
  assert.strictEqual(acha('editado'), 1);
  assert.strictEqual(acha('horario atingido'), 1);
  assert.strictEqual(acha('nada disso'), 0);
});

test('Buscar com várias palavras exige todas, em qualquer ordem', () => {
  assert.strictEqual(H.filtrar(base, { texto: 'loja pendente' }).length, 1);
  assert.strictEqual(H.filtrar(base, { texto: 'pendente loja' }).length, 1);
  assert.strictEqual(H.filtrar(base, { texto: 'loja casa' }).length, 0);
});

test('Buscar acha o dia e a hora em que aconteceu', () => {
  assert.strictEqual(H.filtrar(base, { texto: '22/10/2026' }).length, 1, 'só a exclusão aconteceu no dia 22');
  assert.strictEqual(H.quando(dia(28, 9)), '28/10/2026, 09:00');
});

test('os três campos combinam (E) e vazio mostra tudo', () => {
  assert.strictEqual(H.filtrar(base, {}).length, 4);
  assert.strictEqual(H.filtrar(base, { nome: '', projeto: ' ', texto: '  ' }).length, 4);
  assert.deepStrictEqual(nomes(H.filtrar(base, { nome: 'reuniao', projeto: 'loja', texto: 'carlos' })), ['Reunião']);
  assert.strictEqual(H.filtrar(base, { nome: 'velho', projeto: 'casa' }).length, 0);
});

test('entrada guarda uma cópia dos campos do registro; entradas antigas sem eles continuam válidas', () => {
  const [x] = H.sanear([{ t: 1, tipo: 'criado', nome: 'A', projeto: 'P', estado: 'S', obs: 'O', horario: '19:00', data: '2026-10-27' }]);
  assert.deepStrictEqual([x.projeto, x.estado, x.obs, x.horario, x.data], ['P', 'S', 'O', '19:00', '2026-10-27']);
  const [y] = H.sanear([{ t: 1, tipo: 'criado', nome: 'A' }]);
  assert.strictEqual(y.projeto, '');
});

test('vence em 1 dia útil: terça→quarta; sexta e fim de semana→segunda, mesma hora', () => {
  const dow = (t) => new Date(t).getDay();
  const ter = new Date(2026, 9, 27, 10, 30).getTime();            // terça 27/10
  assert.strictEqual(H.venceEm(ter), new Date(2026, 9, 28, 10, 30).getTime());
  const sex = new Date(2026, 9, 30, 15, 0).getTime();             // sexta 30/10
  assert.strictEqual(H.venceEm(sex), new Date(2026, 10, 2, 15, 0).getTime());
  assert.strictEqual(dow(H.venceEm(sex)), 1);
  const sab = new Date(2026, 9, 31, 9, 0).getTime();              // sábado
  assert.strictEqual(H.venceEm(sab), new Date(2026, 10, 2, 9, 0).getTime());
  const dom = new Date(2026, 10, 1, 23, 0).getTime();             // domingo
  assert.strictEqual(H.venceEm(dom), new Date(2026, 10, 2, 23, 0).getTime());
});

test('podar tira só o que venceu e devolve a mesma lista se nada venceu', () => {
  const sex = new Date(2026, 9, 30, 15, 0).getTime();
  const l = [e('criado', 'A', sex), e('criado', 'B', sex - 3600000 * 24 * 4)];
  const segManha = new Date(2026, 10, 2, 9, 0);   // antes de vencer A (seg 15h)
  assert.deepStrictEqual(H.podar(l, segManha).map((x) => x.nome), ['A']);
  const seg16 = new Date(2026, 10, 2, 15, 0, 1);
  assert.deepStrictEqual(H.podar(l, seg16), []);
  const mesma = [l[0]];
  assert.strictEqual(H.podar(mesma, segManha), mesma);
});

test('remover tira só a entrada escolhida, mesmo havendo outras iguais', () => {
  const a = e('criado', 'X', 1), b = e('criado', 'X', 1);
  const r = H.remover([a, b], a);
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0], b);
});

test('busca ignora maiúsculas e acentos', () => {
  assert.deepStrictEqual(H.filtrar(base, { texto: 'acao otima' }).map((x) => x.nome), ['Ação Ótima']);
  assert.strictEqual(H.filtrar(base, { texto: 'REUNIAO' }).length, 2);
  assert.strictEqual(H.filtrar(base, { texto: '20:00' }).length, 1);
  assert.strictEqual(H.filtrar(base, { texto: 'nada disso' }).length, 0);
});

