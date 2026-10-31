/*
 * senha.js — regras da senha de acesso (sem tela, para poder testar).
 *
 * IMPORTANTE: isto é só uma trava de "porta fechada", não segurança de verdade. Quem sabe mexer
 * nas ferramentas do navegador consegue passar, e quem puder ler o Firestore enxerga o "hash"
 * da senha (uma senha fraca se descobre por tentativa). Não protege os registros no Firebase.
 *
 *   - UMA senha para tudo. Com o Firebase ligado ela mora no Firestore, no documento
 *     /acesso/senha, e vale em todos os aparelhos. É criada uma única vez (as regras do
 *     Firestore não deixam trocar nem apagar). Sem Firebase, vale só neste navegador.
 *   - Guarda só um "hash" (PBKDF2-SHA-256 com sal), nunca a senha em texto.
 *   - Fica logado por 24 horas (do momento do login, não renova sozinho); depois pede de novo.
 *     Essa sessão fica só no aparelho.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.RegistrosSenha = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CHAVE_CONTA = 'registros:conta';
  const CHAVE_SESSAO = 'registros:sessao';
  const DURACAO_MS = 24 * 60 * 60 * 1000;
  const MINIMO = 4;

  function paraHex(bytes) {
    return Array.prototype.map.call(new Uint8Array(bytes), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  const ITERACOES = 150000;

  // PBKDF2-SHA-256 do navegador (devolve 64 letras/números). Se ele não estiver disponível
  // (página sem "contexto seguro"), usa um hash simples próprio, que basta para uma trava fraca.
  function resumo(sal, senha) {
    const c = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (c && c.subtle && typeof TextEncoder !== 'undefined') {
      const enc = new TextEncoder();
      return c.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']).then(function (chave) {
        return c.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(sal), iterations: ITERACOES, hash: 'SHA-256' }, chave, 256);
      }).then(paraHex);
    }
    const texto = sal + ':' + senha;
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < texto.length; i++) {
      const ch = texto.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return Promise.resolve('f' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0'));
  }

  function novoSal() {
    const c = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (c && typeof c.getRandomValues === 'function') return paraHex(c.getRandomValues(new Uint8Array(16)));
    let t = '';
    while (t.length < 32) t += Math.floor(Math.random() * 16).toString(16);
    return t;
  }

  function ler(arm, chave) {
    try { const v = arm.getItem(chave); return v === null || v === undefined ? null : v; } catch (e) { return null; }
  }
  function gravar(arm, chave, valor) {
    try { arm.setItem(chave, valor); return true; } catch (e) { return false; }
  }

  function conta(arm) {
    const bruto = ler(arm, CHAVE_CONTA);
    if (!bruto) return null;
    try {
      const c = JSON.parse(bruto);
      return c && typeof c.sal === 'string' && typeof c.hash === 'string' ? c : null;
    } catch (e) { return null; }
  }

  function existeConta(arm) { return conta(arm) !== null; }

  // Aceita só { sal, hash } de texto (o que vem do Firestore pode ser qualquer coisa).
  function contaValida(c) {
    return !!c && typeof c.sal === 'string' && typeof c.hash === 'string' &&
      c.sal.length >= 16 && c.sal.length <= 64 && c.hash.length >= 16 && c.hash.length <= 64
      ? { sal: c.sal, hash: c.hash } : null;
  }

  // Cópia da conta guardada neste aparelho (para conferir a senha sem internet).
  function guardarConta(arm, c) {
    const v = contaValida(c);
    return !!v && gravar(arm, CHAVE_CONTA, JSON.stringify(v));
  }
  function limparConta(arm) {
    try { arm.removeItem(CHAVE_CONTA); arm.removeItem(CHAVE_SESSAO); } catch (e) { /* sem ação */ }
  }

  // Gera { sal, hash } para uma senha nova.
  function derivarConta(senha) {
    const sal = novoSal();
    return resumo(sal, senha).then(function (hash) { return { sal: sal, hash: hash }; });
  }

  // Erros possíveis: 'curta', 'diferente', 'ja-existe', 'sem-armazenamento'.
  function validarNova(senha, confirmacao) {
    if (typeof senha !== 'string' || senha.length < MINIMO) return 'curta';
    if (senha !== confirmacao) return 'diferente';
    return '';
  }

  // Cria a ÚNICA conta e já entra. Com `gravarNuvem(conta)` (devolve uma promessa de
  // { ok: true } ou { ok: false, erro }) a conta é guardada no Firestore antes de valer;
  // sem ela (modo sem Firebase) fica só neste navegador.
  function criar(arm, senha, confirmacao, agora, gravarNuvem) {
    if (!gravarNuvem && existeConta(arm)) return Promise.resolve({ ok: false, erro: 'ja-existe' });
    const erro = validarNova(senha, confirmacao);
    if (erro) return Promise.resolve({ ok: false, erro: erro });
    return derivarConta(senha).then(function (nova) {
      const gravada = gravarNuvem ? gravarNuvem(nova) : Promise.resolve({ ok: true });
      return gravada.then(function (res) {
        if (!res || !res.ok) return { ok: false, erro: (res && res.erro) || 'rede' };
        if (!gravarNuvem && existeConta(arm)) return { ok: false, erro: 'ja-existe' }; // outra aba criou no meio
        if (!guardarConta(arm, nova)) return { ok: false, erro: 'sem-armazenamento' };
        if (!gravar(arm, CHAVE_SESSAO, String((agora || new Date()).getTime()))) return { ok: false, erro: 'sem-armazenamento' };
        return { ok: true };
      });
    });
  }

  // Confere a senha (contra `alvo`, ou contra a conta guardada aqui); se certa, abre a sessão de 24 h.
  function entrar(arm, senha, agora, alvo) {
    const c = contaValida(alvo) || conta(arm);
    if (!c || typeof senha !== 'string') return Promise.resolve({ ok: false, erro: 'errada' });
    return resumo(c.sal, senha).then(function (hash) {
      if (hash !== c.hash) return { ok: false, erro: 'errada' };
      if (!gravar(arm, CHAVE_SESSAO, String((agora || new Date()).getTime()))) return { ok: false, erro: 'sem-armazenamento' };
      return { ok: true };
    });
  }

  // Logado se existe sessão e ainda não passaram 24 h (relógio adiantado/atrasado demais não vale).
  function sessaoValida(arm, agora) {
    if (!existeConta(arm)) return false;
    const t = Number(ler(arm, CHAVE_SESSAO));
    if (!isFinite(t) || t <= 0) return false;
    const decorrido = (agora || new Date()).getTime() - t;
    return decorrido >= 0 && decorrido < DURACAO_MS;
  }

  function sair(arm) {
    try { arm.removeItem(CHAVE_SESSAO); } catch (e) { /* sem ação */ }
  }

  return {
    CHAVE_CONTA: CHAVE_CONTA,
    CHAVE_SESSAO: CHAVE_SESSAO,
    DURACAO_MS: DURACAO_MS,
    MINIMO: MINIMO,
    existeConta: existeConta,
    contaValida: contaValida,
    guardarConta: guardarConta,
    limparConta: limparConta,
    derivarConta: derivarConta,
    validarNova: validarNova,
    criar: criar,
    entrar: entrar,
    sessaoValida: sessaoValida,
    sair: sair,
  };
});
