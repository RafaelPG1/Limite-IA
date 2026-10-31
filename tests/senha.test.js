// Testes da senha de acesso. Rode com: node --test testes-senha.js
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/core/senha.js');

function armazenamentoFalso() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const em = (h, d) => new Date(2026, 9, d || 29, h, 0, 0);

test('começa sem conta e sem sessão', () => {
  const a = armazenamentoFalso();
  assert.equal(S.existeConta(a), false);
  assert.equal(S.sessaoValida(a, em(10)), false);
});

test('criar: exige mínimo de caracteres e as duas senhas iguais', async () => {
  const a = armazenamentoFalso();
  assert.deepEqual(await S.criar(a, 'abc', 'abc', em(10)), { ok: false, erro: 'curta' });
  assert.deepEqual(await S.criar(a, 'abcd', 'abce', em(10)), { ok: false, erro: 'diferente' });
  assert.equal(S.existeConta(a), false, 'erro não cria nada');
});

test('criar: cria a conta, já entra e não guarda a senha em texto', async () => {
  const a = armazenamentoFalso();
  assert.deepEqual(await S.criar(a, 'minhasenha', 'minhasenha', em(10)), { ok: true });
  assert.equal(S.existeConta(a), true);
  assert.equal(S.sessaoValida(a, em(11)), true);
  assert.equal(a.getItem(S.CHAVE_CONTA).includes('minhasenha'), false);
});

test('só existe UMA conta: criar de novo é recusado e não troca a senha', async () => {
  const a = armazenamentoFalso();
  await S.criar(a, 'primeira', 'primeira', em(10));
  assert.deepEqual(await S.criar(a, 'segunda!', 'segunda!', em(10)), { ok: false, erro: 'ja-existe' });
  S.sair(a);
  assert.equal((await S.entrar(a, 'segunda!', em(12))).ok, false);
  assert.equal((await S.entrar(a, 'primeira', em(12))).ok, true);
});

test('entrar: senha errada não abre sessão; certa abre', async () => {
  const a = armazenamentoFalso();
  await S.criar(a, 'abcd', 'abcd', em(8));
  S.sair(a);
  assert.equal(S.sessaoValida(a, em(9)), false, 'depois de sair, trancado');
  assert.deepEqual(await S.entrar(a, 'ABCD', em(9)), { ok: false, erro: 'errada' });
  assert.deepEqual(await S.entrar(a, '', em(9)), { ok: false, erro: 'errada' });
  assert.equal(S.sessaoValida(a, em(9)), false);
  assert.deepEqual(await S.entrar(a, 'abcd', em(9)), { ok: true });
  assert.equal(S.sessaoValida(a, em(10)), true);
});

test('fica logado por 24 horas contadas do login e depois pede a senha de novo', async () => {
  const a = armazenamentoFalso();
  await S.criar(a, 'abcd', 'abcd', em(10, 29));
  assert.equal(S.sessaoValida(a, em(9, 30)), true, '23h depois ainda vale');
  assert.equal(S.sessaoValida(a, new Date(2026, 9, 30, 9, 59, 59)), true);
  assert.equal(S.sessaoValida(a, em(10, 30)), false, '24h exatas: venceu');
  assert.equal(S.sessaoValida(a, em(15, 31)), false);
  // entrar de novo recomeça a contagem
  await S.entrar(a, 'abcd', em(15, 31));
  assert.equal(S.sessaoValida(a, em(14, 32)), true);
});

test('sessão com data no futuro (relógio mexido) ou lixo não vale', async () => {
  const a = armazenamentoFalso();
  await S.criar(a, 'abcd', 'abcd', em(10));
  assert.equal(S.sessaoValida(a, em(9)), false, 'login "no futuro"');
  a.setItem(S.CHAVE_SESSAO, 'abc');
  assert.equal(S.sessaoValida(a, em(11)), false);
  a.setItem(S.CHAVE_SESSAO, String(em(10).getTime()));
  a.removeItem(S.CHAVE_CONTA);
  assert.equal(S.sessaoValida(a, em(11)), false, 'sem conta, sessão não vale');
});

test('conta corrompida é tratada como inexistente; armazenamento que falha não quebra', async () => {
  const a = armazenamentoFalso();
  a.setItem(S.CHAVE_CONTA, '{lixo');
  assert.equal(S.existeConta(a), false);
  const ruim = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.equal(S.existeConta(ruim), false);
  assert.deepEqual(await S.criar(ruim, 'abcd', 'abcd', em(10)), { ok: false, erro: 'sem-armazenamento' });
  S.sair(ruim);
});

test('o mesmo texto com sal diferente gera hash diferente', async () => {
  const a = armazenamentoFalso(), b = armazenamentoFalso();
  await S.criar(a, 'abcd', 'abcd', em(10));
  await S.criar(b, 'abcd', 'abcd', em(10));
  assert.notEqual(JSON.parse(a.getItem(S.CHAVE_CONTA)).hash, JSON.parse(b.getItem(S.CHAVE_CONTA)).hash);
});

// ---------- senha única no Firebase (Firestore) ----------
test('com Firebase: a conta só vale depois de gravada na nuvem; falha da nuvem não cria nada', async () => {
  const a = armazenamentoFalso();
  assert.deepEqual(await S.criar(a, 'abcd', 'abcd', em(10), async () => ({ ok: false, erro: 'rede' })), { ok: false, erro: 'rede' });
  assert.deepEqual(await S.criar(a, 'abcd', 'abcd', em(10), async () => ({ ok: false, erro: 'regras' })), { ok: false, erro: 'regras' });
  assert.deepEqual(await S.criar(a, 'abcd', 'abcd', em(10), async () => ({ ok: false, erro: 'ja-existe' })), { ok: false, erro: 'ja-existe' });
  assert.equal(S.existeConta(a), false);
  assert.equal(S.sessaoValida(a, em(11)), false);
});

test('com Firebase: o que vai para a nuvem é só sal e hash (nunca a senha), no formato das regras', async () => {
  const a = armazenamentoFalso();
  let enviado = null;
  const r = await S.criar(a, 'minhasenha', 'minhasenha', em(10), async (c) => { enviado = c; return { ok: true }; });
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(enviado).sort(), ['hash', 'sal']);
  assert.equal(JSON.stringify(enviado).includes('minhasenha'), false);
  assert.match(enviado.sal, /^[0-9a-f]{32}$/);
  assert.match(enviado.hash, /^[0-9a-f]{64}$/);
  assert.notEqual(enviado.hash, 'minhasenha');
});

test('com Firebase: outro aparelho confere a senha contra a conta lida da nuvem', async () => {
  const aparelhoA = armazenamentoFalso(), aparelhoB = armazenamentoFalso();
  let nuvem = null;
  await S.criar(aparelhoA, 'senha-unica', 'senha-unica', em(10), async (c) => { nuvem = c; return { ok: true }; });
  // aparelho B nunca viu a senha: o app lê a conta da nuvem e guarda uma cópia
  S.guardarConta(aparelhoB, nuvem);
  assert.equal((await S.entrar(aparelhoB, 'outra-coisa', em(11), nuvem)).ok, false);
  assert.equal(S.sessaoValida(aparelhoB, em(11)), false);
  assert.equal((await S.entrar(aparelhoB, 'senha-unica', em(11), nuvem)).ok, true);
  assert.equal(S.sessaoValida(aparelhoB, em(12)), true);
});

test('guardar/limpar a cópia da conta: aceita só sal+hash válidos; limpar também tranca', async () => {
  const a = armazenamentoFalso();
  assert.equal(S.guardarConta(a, { sal: 'x', hash: 'y' }), false, 'curtos demais');
  assert.equal(S.guardarConta(a, { sal: 1, hash: 2 }), false);
  assert.equal(S.guardarConta(a, null), false);
  const c = { sal: 'a'.repeat(32), hash: 'b'.repeat(64) };
  assert.equal(S.guardarConta(a, Object.assign({ extra: 'x' }, c)), true);
  assert.deepEqual(JSON.parse(a.getItem(S.CHAVE_CONTA)), c, 'campos extras são descartados');
  a.setItem(S.CHAVE_SESSAO, String(em(10).getTime()));
  assert.equal(S.sessaoValida(a, em(11)), true);
  S.limparConta(a);
  assert.equal(S.existeConta(a), false);
  assert.equal(S.sessaoValida(a, em(11)), false);
});

test('com Firebase: criar não é barrado por cópia antiga local (quem decide é a nuvem)', async () => {
  const a = armazenamentoFalso();
  S.guardarConta(a, { sal: 'a'.repeat(32), hash: 'b'.repeat(64) });
  const r = await S.criar(a, 'novasenha', 'novasenha', em(10), async () => ({ ok: true }));
  assert.equal(r.ok, true);
});
