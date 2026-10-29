// Thành phần giao diện dùng lại

import { escapeHtml } from './utils.js';

const CHO_PHEP = new Set([
  'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'UL', 'OL', 'LI', 'TABLE', 'THEAD',
  'TBODY', 'TR', 'TH', 'TD', 'SUB', 'SUP', 'SPAN', 'DIV', 'IMG', 'A', 'CODE',
  'BLOCKQUOTE', 'HR', 'SMALL', 'FIGURE', 'FIGCAPTION',
]);

const THUOC_TINH = new Set(['href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'class', 'loading']);

/** Làm sạch HTML do người biên soạn nhập. */
export function sachHoa(html = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html);
  const walk = (node) => {
    for (const el of Array.from(node.children)) {
      walk(el);
      if (!CHO_PHEP.has(el.tagName)) {
        el.replaceWith(...Array.from(el.childNodes));
        continue;
      }
      for (const attr of Array.from(el.attributes)) {
        const ten = attr.name.toLowerCase();
        const giaTri = attr.value.trim();
        if (!THUOC_TINH.has(ten)) { el.removeAttribute(attr.name); continue; }
        if ((ten === 'href' || ten === 'src') && /^\s*(javascript|data|vbscript):/i.test(giaTri)) {
          el.removeAttribute(attr.name);
        }
      }
      if (el.tagName === 'A') {
        el.setAttribute('rel', 'noopener');
        if (/^https?:/i.test(el.getAttribute('href') || '')) el.setAttribute('target', '_blank');
      }
      if (el.tagName === 'IMG') el.setAttribute('loading', 'lazy');
    }
  };
  walk(tpl.content);
  return tpl.innerHTML;
}

export function noiDung(q) {
  return sachHoa(q?.deBai || '');
}

export function nhanY(q) {
  const y = String(q?.y || '').trim();
  if (!y) return '';
  return /^[a-zA-Z]$/.test(y) ? y : `.${y}`;
}

export function nhanNgan(q) {
  return `${q.soCau}${nhanY(q)}`;
}

export function nhanCau(q) {
  return `Câu ${nhanNgan(q)}`;
}

export const MUC_DO = {
  1: { ten: 'Nền tảng', lop: 'ok', moTa: 'Làm chắc để giữ điểm' },
  2: { ten: 'Khá', lop: 'accent', moTa: 'Cần suy luận vài bước' },
  3: { ten: 'Nâng cao', lop: 'danger', moTa: 'Lấy điểm 9 – 10' },
};

export function chipMucDo(mucDo) {
  const m = MUC_DO[mucDo] || MUC_DO[1];
  return `<span class="chip ${m.lop}">${m.ten}</span>`;
}

export function nhanTrangThai(status) {
  switch (status) {
    case 'ok': return { chu: 'Đúng', lop: 'ok' };
    case 'bad': return { chu: 'Sai', lop: 'bad' };
    case 'unsure': return { chu: 'Chưa chắc', lop: 'unsure' };
    default: return { chu: 'Chưa làm', lop: 'none' };
  }
}

export function daTraLoi(a) {
  return Boolean(a && (String(a.value || '').trim() || a.status === 'unsure' || a.status === 'ok' || a.status === 'bad'));
}

export function soCauDaLam(session) {
  if (!session?.answers) return 0;
  return Object.values(session.answers).filter(daTraLoi).length;
}

export function trangThaiCau(session, qid) {
  return session?.answers?.[qid]?.status || 'none';
}

export function namCuaDe(meta) {
  return meta?.nam || '';
}

export function dongDe(meta) {
  const tinh = meta?.tinh || 'Đề';
  return `${tinh} · ${meta?.nam || ''}`;
}

export function examCard(meta, { href, progress = 0, showProvince = true } = {}) {
  const link = href || `#/de/${encodeURIComponent(meta.id)}`;
  const soY = meta.soY || meta.soCau || 0;
  return `
    <a class="exam-row" href="${link}">
      <div class="year">${escapeHtml(String(meta.nam || '—'))}<small>${escapeHtml(meta.tinh || '')}</small></div>
      <div class="grow">
        <b>${escapeHtml(meta.tieuDe || `Đề Toán ${meta.nam || ''}`)}</b>
        <div class="meta">
          <span>${meta.thoiGian || 90} phút</span>
          <span>${soY} câu</span>
          ${meta.deMau ? '<span class="chip accent" style="padding:1px 7px">Đề mẫu</span>' : ''}
          ${showProvince ? '' : ''}
          ${progress ? `<span>${progress}% đã làm</span>` : ''}
        </div>
      </div>
      <span class="arrow" aria-hidden="true">›</span>
    </a>`;
}

export function emptyState({ icon = '🗂', title = 'Chưa có gì ở đây', text = '', action = '' }) {
  return `
    <div class="card card-pad center" style="padding:34px 20px">
      <div style="font-size:2.1rem;line-height:1;margin-bottom:10px">${icon}</div>
      <h3 style="margin-bottom:6px">${escapeHtml(title)}</h3>
      <p class="muted" style="max-width:44ch;margin:0 auto 16px">${escapeHtml(text)}</p>
      ${action}
    </div>`;
}

export function hinhAnh(q) {
  if (!q?.hinhAnh?.duongDan) return '';
  return `
    <figure class="figure">
      <img src="${escapeHtml(q.hinhAnh.duongDan)}" alt="${escapeHtml(q.hinhAnh.moTa || 'Hình vẽ minh hoạ')}">
      ${q.hinhAnh.moTa ? `<figcaption>${escapeHtml(q.hinhAnh.moTa)}</figcaption>` : ''}
    </figure>`;
}

export function dongThongTinDe(meta) {
  const nguon = meta?.nguon || {};
  const linkNguon = nguon.url
    ? `<a href="${escapeHtml(nguon.url)}" target="_blank" rel="noopener">${escapeHtml(nguon.ten || 'Nguồn')} ↗</a>`
    : escapeHtml(nguon.ten || 'Tự soạn');
  return linkNguon;
}

export function thanhPhanTram(so, tong) {
  if (!tong) return 0;
  return Math.max(0, Math.min(100, Math.round((so / tong) * 100)));
}

export function diemCuaDe(exam) {
  return (exam?.cauHoi || []).reduce((s, q) => s + (Number(q.diem) || 0), 0);
}

export function nhomTheoCau(exam) {
  const map = new Map();
  for (const q of exam?.cauHoi || []) {
    if (!map.has(q.soCau)) map.set(q.soCau, []);
    map.get(q.soCau).push(q);
  }
  return [...map.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
}
