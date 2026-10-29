// Định tuyến bằng hash, không cần máy chủ.

const routes = [];
let dangChay = false;
let renderToken = 0;

export function dangKy(pattern, handler) {
  routes.push({ pattern, parts: pattern.split('/').filter(Boolean), handler });
}

export function tachHash(hash = location.hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const path = '/' + pathPart.replace(/^\/+|\/+$/g, '');
  const query = {};
  for (const [k, v] of new URLSearchParams(queryPart)) query[k] = v;
  return { path: path === '/' ? '/' : path.replace(/\/+$/, ''), query, raw };
}

function khop(route, path) {
  const segs = path.split('/').filter(Boolean);
  if (segs.length !== route.parts.length) return null;
  const params = {};
  for (let i = 0; i < segs.length; i++) {
    const p = route.parts[i];
    if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(segs[i]);
    else if (p !== segs[i]) return null;
  }
  return params;
}

export function dieuHuong(hash, { replace = false } = {}) {
  if (replace) {
    history.replaceState(null, '', hash);
    return xuLy();
  }
  if (location.hash === hash) return xuLy();
  location.hash = hash;
  return Promise.resolve();
}

const main = () => document.getElementById('main');

function hienLoading() {
  const el = main();
  if (el) el.innerHTML = '<div class="loading">Đang mở…</div>';
}

export async function xuLy() {
  const { path, query } = tachHash();
  const token = ++renderToken;
  let matched = null;
  let params = {};
  for (const route of routes) {
    const p = khop(route, path);
    if (p) { matched = route; params = p; break; }
  }
  capNhatNav(path);
  hienLoading();
  if (!matched) {
    main().innerHTML = `
      <div class="card card-pad center" style="margin-top:40px">
        <div style="font-size:2.4rem">🧭</div>
        <h1>Không tìm thấy trang</h1>
        <p class="muted">Đường dẫn <code>${path.replace(/</g, '&lt;')}</code> không tồn tại.</p>
        <p><a class="btn primary" href="#/">Về trang chủ</a></p>
      </div>`;
    return;
  }
  try {
    const ketQua = await matched.handler({ params, query, path });
    if (token !== renderToken) return;
    if (typeof ketQua === 'string') main().innerHTML = ketQua;
    else if (ketQua?.html !== undefined) main().innerHTML = ketQua.html;
    if (typeof ketQua?.mount === 'function') await ketQua.mount(main());
    if (token === renderToken) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      main().classList.remove('fade-in');
      void main().offsetWidth;
      main().classList.add('fade-in');
    }
  } catch (err) {
    console.error(err);
    if (token !== renderToken) return;
    main().innerHTML = `
      <div class="card card-pad" style="margin-top:30px">
        <h1 style="font-size:1.4rem">Có lỗi khi mở trang</h1>
        <p class="muted">${String(err?.message || err).replace(/</g, '&lt;')}</p>
        <div class="btn-row">
          <button class="btn primary" type="button" onclick="location.reload()">Tải lại</button>
          <a class="btn" href="#/">Về trang chủ</a>
        </div>
      </div>`;
  }
}

function capNhatNav(path) {
  const map = [
    ['/de', 'exams'], ['/lam', 'exams'], ['/ket-qua', 'exams'], ['/in', 'exams'], ['/cau', 'exams'],
    ['/chuyen-de', 'topics'], ['/luyen', 'topics'],
    ['/so-loi', 'mistakes'], ['/cong-thuc', 'formulas'], ['/lo-trinh', 'roadmap'],
    ['/kiem-tra', 'home'],
  ];
  let active = 'home';
  if (path === '/cai-dat' || path === '/gioi-thieu') active = '';
  else if (path !== '/') {
    for (const [prefix, name] of map) {
      if (path === prefix || path.startsWith(prefix + '/')) { active = name; break; }
    }
  }
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === active);
  });
}

export function batDau() {
  if (dangChay) return;
  dangChay = true;
  window.addEventListener('hashchange', xuLy);
  xuLy();
}
