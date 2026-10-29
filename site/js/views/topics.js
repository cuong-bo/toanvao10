import { taiChuyenDe, taiTatCaDe, ganThongTinDe } from '../data.js';
import { emptyState, MUC_DO, nhanNgan } from '../components.js';
import { escapeHtml, rutGon } from '../utils.js';

function demTheo(deList) {
  const map = new Map();
  for (const exam of deList) {
    for (const q of exam.cauHoi || []) {
      const cur = map.get(q.chuyenDe) || { tong: 0, muc: { 1: 0, 2: 0, 3: 0 }, de: new Set() };
      cur.tong += 1;
      cur.muc[q.mucDo] = (cur.muc[q.mucDo] || 0) + 1;
      cur.de.add(exam.id);
      map.set(q.chuyenDe, cur);
    }
  }
  return map;
}

export async function danhSachChuyenDe() {
  const [topics, deList] = await Promise.all([taiChuyenDe(), taiTatCaDe().catch(() => [])]);
  const dem = demTheo(deList);
  const tongCau = [...dem.values()].reduce((s, v) => s + v.tong, 0);

  const cards = topics.map((t) => {
    const d = dem.get(t.ma) || { tong: 0, muc: { 1: 0, 2: 0, 3: 0 }, de: new Set() };
    return `
      <a class="card card-pad card-hover" href="#/chuyen-de/${encodeURIComponent(t.ma)}" style="text-decoration:none;color:inherit;display:block">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <span style="display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:${t.mau}1a;color:${t.mau};font-size:1.3rem;font-weight:800">${escapeHtml(t.icon || '◆')}</span>
          <div><b style="font-size:1rem">${escapeHtml(t.ten)}</b><div class="muted tiny">${d.tong} câu · ${d.de.size} đề</div></div>
        </div>
        <p class="muted small" style="margin:0 0 12px;min-height:2.6em">${escapeHtml(rutGon(t.moTa, 105))}</p>
        <div class="bar-track" style="height:7px">
          <i style="width:${Math.round((d.muc[1] / (d.tong || 1)) * 100)}%;background:#3d9e68"></i>
          <i style="width:${Math.round((d.muc[2] / (d.tong || 1)) * 100)}%;background:#d18a1f"></i>
          <i style="width:${Math.round((d.muc[3] / (d.tong || 1)) * 100)}%;background:#b34a3f"></i>
        </div>
        <div class="chip-row" style="margin-top:10px">
          <span class="chip ok">${d.muc[1]} nền tảng</span>
          <span class="chip accent">${d.muc[2]} khá</span>
          <span class="chip danger">${d.muc[3]} nâng cao</span>
        </div>
      </a>`;
  }).join('');

  return `
    <div class="page-head">
      <div>
        <div class="eyebrow">Luyện theo phần</div>
        <h1>Chuyên đề</h1>
        <p class="lead">${topics.length} chuyên đề, ${tongCau} câu có lời giải. Chọn mức độ phù hợp với mình — nền tảng trước, nâng cao sau.</p>
      </div>
    </div>
    <div class="card card-pad" style="margin-bottom:16px;background:linear-gradient(120deg,var(--brand-soft),var(--surface) 70%);border-color:transparent">
      <div class="chip-row" style="margin-bottom:6px"><span class="chip brand">Gợi ý</span></div>
      <p class="small" style="margin:0">Nếu mới bắt đầu, em hãy làm <b>Nền tảng</b> của Rút gọn, Phương trình và Hàm số trước. Ba phần này thường chiếm khoảng 5–6 điểm trong đề thi.</p>
    </div>
    <div class="grid two">${cards || emptyState({ icon: '◎', title: 'Chưa có chuyên đề' })}</div>`;
}

export async function chiTietChuyenDe({ params }) {
  const [topics, deList] = await Promise.all([taiChuyenDe(), taiTatCaDe().catch(() => [])]);
  const topic = topics.find((t) => t.ma === params.ma);
  if (!topic) {
    return emptyState({
      icon: '❓', title: 'Không tìm thấy chuyên đề',
      text: 'Chuyên đề này có thể đã đổi mã.',
      action: '<a class="btn primary" href="#/chuyen-de">Xem tất cả chuyên đề</a>',
    });
  }

  const cau = [];
  for (const exam of deList) {
    for (const q of ganThongTinDe(exam)) {
      if (q.chuyenDe === topic.ma) cau.push(q);
    }
  }
  const theoMuc = { 1: [], 2: [], 3: [] };
  cau.forEach((q) => { (theoMuc[q.mucDo] || theoMuc[1]).push(q); });
  const deCoCau = [...new Set(cau.map((q) => q.examId))];

  const levelCards = [1, 2, 3].map((m) => {
    const ds = theoMuc[m];
    return `
      <a class="card level-card card-hover" href="#/luyen?cd=${encodeURIComponent(topic.ma)}&amp;muc=${m}" style="text-decoration:none">
        <span class="dot lv${m}" aria-hidden="true"></span>
        <div class="grow">
          <b>${MUC_DO[m].ten}</b>
          <span>${MUC_DO[m].moTa}</span>
        </div>
        <span class="n">${ds.length} câu</span>
        <span class="muted" aria-hidden="true">›</span>
      </a>`;
  }).join('');

  const deLienQuan = deList.filter((d) => deCoCau.includes(d.id)).slice(0, 6);
  const moiCau = cau.slice(0, 6);

  return `
    <p class="small" style="margin-bottom:12px"><a href="#/chuyen-de">← Tất cả chuyên đề</a></p>
    <section class="topic-banner" style="background:${topic.mau}">
      <div class="eyebrow" style="color:#f6cf99">Chuyên đề ${topic.thuTu || ''}</div>
      <h1>${escapeHtml(topic.ten)}</h1>
      <p>${escapeHtml(topic.moTa)}</p>
    </section>

    <div class="split two-col" style="margin-top:16px">
      <div>
        <div class="card card-pad">
          <div class="section-head" style="margin-bottom:10px">
            <h2 style="font-size:1.05rem">Chọn mức độ</h2>
            <span class="muted tiny">${cau.length} câu</span>
          </div>
          <div style="display:grid;gap:10px">${levelCards}</div>
          <a class="btn primary wide" style="margin-top:12px" href="#/luyen?cd=${encodeURIComponent(topic.ma)}">Luyện tổng hợp tất cả mức</a>
          <p class="file-note">Mỗi lượt luyện chọn tối đa 20 câu để không quá tải. Câu sai tự vào sổ lỗi.</p>
        </div>
        <div class="card card-pad" style="margin-top:14px">
          <h2 style="font-size:1.05rem">Một vài câu tiêu biểu</h2>
          <div class="result-list" style="margin-top:10px">
            ${moiCau.map((q) => `<a class="result-item" href="#/cau/${encodeURIComponent(q.examId)}/${encodeURIComponent(q.id)}">
              <span class="num">${escapeHtml(nhanNgan(q))}</span>
              <span class="txt">${escapeHtml(rutGon(q.deBai, 90))}</span>
              <span class="st none">${escapeHtml(q.tinh || '')} ${q.nam || ''}</span>
            </a>`).join('') || '<p class="muted small">Chưa có câu nào.</p>'}
          </div>
        </div>
      </div>
      <div>
        <div class="card card-pad">
          <h2 style="font-size:1.05rem">Đề có câu thuộc chuyên đề này</h2>
          <p class="muted small">${deCoCau.length} đề</p>
          <div class="result-list">
            ${deLienQuan.map((d) => `<a class="result-item" href="#/de/${encodeURIComponent(d.id)}">
              <span class="num">${d.nam || ''}</span>
              <span class="txt">${escapeHtml(d.tinh)} — ${escapeHtml(d.tieuDe)}</span>
              <span aria-hidden="true">›</span>
            </a>`).join('') || '<p class="muted small">Chưa có đề.</p>'}
          </div>
        </div>
        <div class="card card-pad" style="margin-top:14px;background:var(--accent-soft);border-color:transparent">
          <b>Mẹo nhỏ</b>
          <p class="small" style="margin:6px 0 0">Làm nền tảng cho đến khi đúng liên tiếp 5 câu rồi mới chuyển mức khá. Đừng vội nhảy sang câu nâng cao khi chưa chắc phần cơ bản.</p>
        </div>
      </div>
    </div>`;
}
