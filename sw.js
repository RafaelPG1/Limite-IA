/*
 * sw.js — service worker MÍNIMO, só para o Chrome oferecer "Instalar app".
 * NÃO guarda nada em cache: toda página e arquivo vêm sempre da rede (conferindo com o servidor),
 * então o site nunca fica "preso" numa versão antiga. Também apaga caches deixados por versões anteriores.
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
// Páginas e arquivos DESTE site sempre vêm da rede, conferindo com o servidor se mudaram
// (cache: 'no-cache'): assim uma publicação nova aparece na hora, sem a cópia velha do navegador
// (o GitHub Pages deixa arquivos em cache por ~10 minutos). Nada é guardado no Cache Storage.
// Outros endereços (Firebase, fontes) seguem normalmente.
self.addEventListener('fetch', function (ev) {
  const r = ev.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  ev.respondWith(fetch(r, { cache: 'no-cache' }));
});
