/*
 * nuvem.js — liga o site ao Firestore (banco do Firebase).
 *
 * É opcional: se não houver configuração, ou o Firebase não carregar (sem internet
 * na primeira abertura, por exemplo), o site segue funcionando sozinho, salvando
 * só neste navegador. A tela (app.js) não sabe nada de Firebase; ela só recebe
 * um "adaptador" com quatro funções simples:
 *   gravar(registro)  apagar(id)  gravarVarios(lista)  observar(aoReceber, aoErrar)
 *
 * Cada registro vira um documento em /registros/{id}, com os campos:
 * nome, projeto, horario, data, estado, obs, ordem.
 */
(function () {
  'use strict';

  var VERSAO = '10.14.1';
  var BASE = 'https://www.gstatic.com/firebasejs/' + VERSAO + '/';
  var COLECAO = 'registros';

  // A tela de senha (bloqueio.js) espera por isto: null = sem Firebase (senha só neste navegador);
  // senão, um objeto { ler(), criar(conta) } para a senha única guardada em /acesso/senha.
  var entregarSenha;
  window.RegistrosSenhaNuvem = new Promise(function (resolver) { entregarSenha = resolver; });
  var app = window.RegistrosApp;
  var cfg = window.FIREBASE_CONFIG;
  if (!app || !cfg || !cfg.projectId) { entregarSenha(null); return; } // modo local, sem nuvem

  app.nuvemCarregando();

  // import() dinâmico funciona em script comum e também abrindo o arquivo direto do disco.
  Promise.all([import(BASE + 'firebase-app.js'), import(BASE + 'firebase-firestore.js')])
    .then(function (mods) {
      var A = mods[0];
      var F = mods[1];

      var firebaseApp = A.initializeApp(cfg);
      var db;
      try {
        // Guarda uma cópia no aparelho: funciona sem internet e sincroniza ao voltar.
        db = F.initializeFirestore(firebaseApp, {
          localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
        });
      } catch (e) {
        db = F.getFirestore(firebaseApp); // navegador sem suporte: segue só com memória
      }
      var colecao = F.collection(db, COLECAO);

      // O id do registro é o id do documento; não é guardado dentro dele.
      function paraDocumento(reg) {
        return {
          nome: reg.nome,
          projeto: reg.projeto,
          horario: reg.horario,
          data: reg.data,
          estado: reg.estado,
          obs: reg.obs,
          ordem: typeof reg.ordem === 'number' ? reg.ordem : Date.now(),
        };
      }

      function tratar(promessa) {
        // setDoc/deleteDoc só terminam quando o servidor confirma (offline ficam na fila).
        // Um erro de verdade (ex.: regras bloqueando) chega aqui.
        return promessa.catch(function (erro) { app.nuvemErro(erro && erro.code); });
      }

      // Senha única: documento /acesso/senha com { sal, hash } (nunca a senha). Criado uma vez;
      // as regras do Firestore não deixam trocar nem apagar (só você, pelo console do Firebase).
      var refSenha = F.doc(db, 'acesso', 'senha');
      function comPrazo(promessa) {
        return new Promise(function (ok, falha) {
          var t = setTimeout(function () { falha({ code: 'unavailable' }); }, 10000);
          promessa.then(function (v) { clearTimeout(t); ok(v); }, function (e) { clearTimeout(t); falha(e); });
        });
      }
      entregarSenha({
        // Lê direto do servidor (não do cache). Devolve { conta: {sal,hash} } ou { conta: null } se ainda não existe.
        ler: function () {
          return comPrazo(F.getDocFromServer(refSenha)).then(function (snap) {
            return { conta: snap.exists() ? snap.data() : null };
          });
        },
        // Cria só se ainda não existir (transação). { ok: true } | { ok: false, erro }
        criar: function (conta) {
          return comPrazo(F.runTransaction(db, function (t) {
            return t.get(refSenha).then(function (snap) {
              if (snap.exists()) { var e = new Error('ja-existe'); e.code = 'ja-existe'; throw e; }
              t.set(refSenha, { sal: conta.sal, hash: conta.hash });
            });
          })).then(function () { return { ok: true }; }, function (e) {
            var c = e && e.code;
            return { ok: false, erro: c === 'ja-existe' ? 'ja-existe' : c === 'permission-denied' ? 'regras' : 'rede' };
          });
        },
      });

      app.conectar({
        gravar: function (reg) {
          return tratar(F.setDoc(F.doc(colecao, reg.id), paraDocumento(reg)));
        },
        apagar: function (id) {
          return tratar(F.deleteDoc(F.doc(colecao, id)));
        },
        gravarVarios: function (lista) {
          // O Firestore aceita até 500 operações por lote.
          var pedacos = [];
          for (var i = 0; i < lista.length; i += 400) pedacos.push(lista.slice(i, i + 400));
          return Promise.all(pedacos.map(function (parte) {
            var lote = F.writeBatch(db);
            parte.forEach(function (reg) { lote.set(F.doc(colecao, reg.id), paraDocumento(reg)); });
            return tratar(lote.commit());
          }));
        },
        observar: function (aoReceber, aoErrar) {
          return F.onSnapshot(
            colecao,
            { includeMetadataChanges: true },
            function (snap) {
              var lista = snap.docs.map(function (d) {
                var dados = d.data();
                dados.id = d.id;
                return dados;
              });
              aoReceber(lista, {
                doCache: snap.metadata.fromCache,
                pendente: snap.metadata.hasPendingWrites,
              });
            },
            function (erro) { aoErrar(erro && erro.code); }
          );
        },
      });
    })
    .catch(function () {
      var semSdk = function () { return Promise.reject({ code: 'nao-carregou' }); };
      entregarSenha({ ler: semSdk, criar: function () { return Promise.resolve({ ok: false, erro: 'rede' }); } });
      app.nuvemFalhou(); // sem internet na primeira vez, ou bloqueio do endereço do Firebase
    });
})();
