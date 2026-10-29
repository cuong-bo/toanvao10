/* Trạm tiếp sức Toán vào 10 — service worker
   - Trang và dữ liệu: ưu tiên mạng, rơi về cache khi offline.
   - Tài nguyên tĩnh: cache trước, cập nhật ngầm.
*/
const VERSION = 'tram10-v2.7.1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './css/print.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/utils.js',
  './js/math.js',
  './js/data.js',
  './js/components.js',
  './js/question.js',
  './js/views/home.js',
  './js/views/exams.js',
  './js/views/exam.js',
  './js/views/take.js',
  './js/views/result.js',
  './js/views/print.js',
  './js/views/topics.js',
  './js/views/practice.js',
  './js/views/single.js',
  './js/views/mistakes.js',
  './js/views/formulas.js',
  './js/views/roadmap.js',
  './js/views/entry.js',
  './js/views/settings.js',
  './js/views/about.js',
  './vendor/katex/katex.min.css',
  './vendor/katex/katex.min.js',
  './vendor/katex/contrib/auto-render.min.js',
  './vendor/katex/fonts/KaTeX_AMS-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Main-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',
  './vendor/katex/fonts/KaTeX_Main-Italic.woff2',
  './vendor/katex/fonts/KaTeX_Main-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',
  './vendor/katex/fonts/KaTeX_Math-Italic.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Script-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size1-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size2-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size3-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2',
  './data/catalog.json',
  './data/topics.json',
  './data/formulas.json',
  './data/roadmap.json',
  './data/entry-test.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.allSettled(CORE.map((url) => cache.add(url)));
    // Nạp sẵn toàn bộ đề (JSON) và hình vẽ để đọc offline.
    try {
      const res = await fetch('data/catalog.json', { cache: 'no-store' });
      if (res.ok) {
        const catalog = await res.json();
        const exams = catalog.de || [];
        await Promise.allSettled(exams.map(async (d) => {
          const file = d.file || `data/exams/${d.id}.json`;
          const r = await fetch(file, { cache: 'no-store' });
          if (!r.ok) return;
          const text = await r.text();
          await cache.put(new Request(file), new Response(text, { headers: { 'Content-Type': 'application/json; charset=utf-8' } }));
          try {
            const exam = JSON.parse(text);
            const imgs = (exam.cauHoi || []).map((q) => q.hinhAnh?.duongDan).filter(Boolean);
            await Promise.allSettled(imgs.map((u) => cache.add(u)));
          } catch { /* bỏ qua ảnh của đề lỗi */ }
        }));
      }
    } catch { /* offline lúc cài: bỏ qua */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function mangTruoc(request, cacheKey) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(cacheKey || request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(cacheKey || request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const index = await cache.match('./index.html') || await cache.match('./');
      if (index) return index;
    }
    throw err;
  }
}

async function cacheTruoc(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request, { ignoreSearch: false });
  if (cached) {
    // cập nhật ngầm
    fetch(request).then((res) => { if (res && res.ok) cache.put(request, res.clone()); }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // bản nháp: luôn lấy từ máy chủ
  if (req.headers.has('range')) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    event.respondWith(mangTruoc(req, './index.html'));
    return;
  }
  if (url.pathname.includes('/data/') || url.pathname.endsWith('.json')) {
    event.respondWith(mangTruoc(req));
    return;
  }
  event.respondWith(cacheTruoc(req));
});
