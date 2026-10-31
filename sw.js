/*
 * sw.js — service worker MÍNIMO, só para o Chrome oferecer "Instalar app".
 * NÃO guarda nada em cache: toda página e arquivo vêm sempre da rede, então o site nunca
 * fica "preso" numa versão antiga. Também apaga caches deixados por versões anteriores.
 * Sem internet, o app instalado abre como o site abriria: sem conexão, a página não carrega.
 */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys()
      .then(function (chaves) { return Promise.all(chaves.map(function (c) { return caches.delete(c); })); })
      .then(function () { return self.clients.claim(); })
  );
});
// Existir (mesmo sem responder) é o que o Chrome pede; sem respondWith a rede atende normalmente.
self.addEventListener('fetch', function () {});
