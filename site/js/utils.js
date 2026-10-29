// Tiện ích dùng chung

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Bỏ dấu tiếng Việt để tìm kiếm không dấu. */
export function boDau(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function chuanHoa(str = '') {
  return boDau(str).replace(/\s+/g, ' ').trim();
}

export function dinhDangNgay(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return ''; }
}

export function dinhDangThoiGian(giay) {
  const s = Math.max(0, Math.floor(Number(giay) || 0));
  const gio = Math.floor(s / 3600);
  const phut = Math.floor((s % 3600) / 60);
  const gi = s % 60;
  const hai = (n) => String(n).padStart(2, '0');
  return gio > 0 ? `${gio}:${hai(phut)}:${hai(gi)}` : `${hai(phut)}:${hai(gi)}`;
}

export function rutGon(text = '', max = 130) {
  const plain = String(text)
    .replace(/\$\$[\s\S]*?\$\$/g, '…')
    .replace(/\\\[[\s\S]*?\\\]/g, '…')
    .replace(/\\\([\s\S]*?\\\)/g, '…')
    .replace(/\$[^$]*\$/g, '…')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? plain.slice(0, max - 1).trimEnd() + '…' : plain;
}

export function taiFile(noiDung, tenFile, kieu = 'application/json') {
  const blob = new Blob([noiDung], { type: kieu });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = tenFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function chepChu(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

export function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2400);
}

export function moHopThoai({ tieuDe, noiDung, dongY = 'Đồng ý', huy = 'Hủy', nguyHiem = false }) {
  return new Promise((resolve) => {
    const root = $('#modal-root');
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title">${escapeHtml(tieuDe)}</h3>
        <p>${noiDung}</p>
        <div class="btn-row">
          <button type="button" class="btn ghost" data-act="huy">${escapeHtml(huy)}</button>
          <button type="button" class="btn ${nguyHiem ? 'danger' : 'primary'}" data-act="ok">${escapeHtml(dongY)}</button>
        </div>
      </div>`;
    const dong = (kq) => { back.remove(); document.removeEventListener('keydown', onKey); resolve(kq); };
    const onKey = (e) => { if (e.key === 'Escape') dong(false); };
    back.addEventListener('click', (e) => {
      if (e.target === back) dong(false);
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'ok') dong(true);
      if (act === 'huy') dong(false);
    });
    document.addEventListener('keydown', onKey);
    root.appendChild(back);
    back.querySelector('[data-act="ok"]').focus();
  });
}

/** Tạo link chia sẻ tuyệt đối tới một hash route. */
export function linkDayDu(hash) {
  const base = location.href.split('#')[0];
  return base + hash;
}

export async function chiaSe({ tieuDe, noiDung, hash }) {
  const url = linkDayDu(hash);
  if (navigator.share) {
    try {
      await navigator.share({ title: tieuDe, text: noiDung, url });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancel';
    }
  }
  const ok = await chepChu(`${tieuDe}\n${noiDung}\n${url}`);
  return ok ? 'copied' : 'failed';
}

export function dinhDangDiem(n) {
  const so = Number(n) || 0;
  if (Number.isInteger(so)) return String(so);
  const s = so.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',');
}

export function bamSuKien(el, event, handler, opts) {
  if (!el) return () => {};
  el.addEventListener(event, handler, opts);
  return () => el.removeEventListener(event, handler, opts);
}

export function thongBaoLoi(err) {
  console.error(err);
  toast(err?.message || 'Có lỗi xảy ra, em thử lại nhé.');
}
