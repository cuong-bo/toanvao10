import { taiCatalog, taiChuyenDe, taiLoTrinh } from '../data.js';
import {
  examCard, emptyState, thanhPhanTram, soCauDaLam,
} from '../components.js';
import {
  getState, thongKe, phienGanNhat, docKetQuaDauVao, docChecklist,
} from '../store.js';
import { escapeHtml, dinhDangThoiGian } from '../utils.js';

function loiChao() {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export async function trangChu() {
  const [catalog, topics, roadmap] = await Promise.all([
    taiCatalog().catch(() => []),
    taiChuyenDe().catch(() => []),
    taiLoTrinh().catch(() => null),
  ]);
  const state = getState();
  const tk = thongKe();
  const session = phienGanNhat();
  const entry = docKetQuaDauVao();

  let continueHtml = '';
  if (session) {
    const meta = catalog.find((d) => d.id === session.examId);
    if (meta) {
      const total = meta.soY || meta.soCau || 1;
      const done = soCauDaLam(session);
      const pct = thanhPhanTram(done, total);
      continueHtml = `
        <a class="continue-card" href="#/lam/${encodeURIComponent(meta.id)}">
          <div class="ring" style="--p:${pct}"><span>${pct}%</span></div>
          <div class="grow">
            <span>Tiếp tục bài đang làm</span>
            <b>${escapeHtml(meta.tieuDe)}</b>
            <span>${done}/${total} câu · ${dinhDangThoiGian(session.elapsed || 0)} đã làm</span>
          </div>
          <span class="arrow" aria-hidden="true">→</span>
        </a>`;
    }
  }

  const deMoi = [...catalog]
    .sort((a, b) => (b.nam - a.nam) || String(b.capNhat || '').localeCompare(String(a.capNhat || '')))
    .slice(0, 4);

  const topicTiles = topics.map((t) => `
    <a class="topic-tile" href="#/chuyen-de/${encodeURIComponent(t.ma)}">
      <span class="ticon" aria-hidden="true">${escapeHtml(t.icon || '◆')}</span>
      <b>${escapeHtml(t.ten)}</b>
      <span>${escapeHtml(t.tenNgan || '')} · 3 mức độ</span>
    </a>`).join('');

  let roadmapHtml = '';
  if (roadmap?.tuan?.length) {
    const checked = docChecklist();
    const tuan = roadmap.tuan;
    const daNop = tuan.map((w) => {
      const items = w.viec || [];
      const xong = items.filter((it) => checked[it.ma]).length;
      return { ...w, xong, tong: items.length };
    });
    const hienTai = daNop.find((w) => w.tong > 0 && w.xong < w.tong) || daNop[daNop.length - 1];
    const xongTatCa = daNop.filter((w) => w.tong > 0 && w.xong === w.tong).length;
    roadmapHtml = `
      <section class="section">
        <div class="section-head">
          <h2>Lộ trình ${tuan.length} tuần</h2>
          <a href="#/lo-trinh">Xem đầy đủ →</a>
        </div>
        <div class="card card-pad">
          <p class="muted small" style="margin-bottom:12px">Đã xong <b>${xongTatCa}/${tuan.length}</b> tuần. Tuần này: <b>${escapeHtml(hienTai?.ten || '')}</b>.</p>
          <div class="roadmap-strip">
            ${daNop.map((w) => {
              const lop = w.xong === w.tong && w.tong > 0 ? 'done' : (w === hienTai ? 'now' : '');
              return `<a class="week-pill ${lop}" href="#/lo-trinh" style="text-decoration:none;color:inherit">
                <b>${w.xong}/${w.tong}</b>Tuần ${w.so}
              </a>`;
            }).join('')}
          </div>
        </div>
      </section>`;
  }

  const entryHtml = entry
    ? `<a class="card card-pad card-hover" href="#/kiem-tra" style="display:block;text-decoration:none;color:inherit">
        <div class="chip-row" style="margin-bottom:8px"><span class="chip brand">Đã kiểm tra trình độ</span><span class="chip">${escapeHtml(entry.level || '')}</span></div>
        <b>Kết quả gần nhất: ${entry.score ?? '—'}/${entry.total ?? '—'} câu</b>
        <p class="muted small" style="margin:4px 0 0">Xem lại gợi ý chuyên đề nên ôn trước →</p>
      </a>`
    : `<a class="card card-pad card-hover" href="#/kiem-tra" style="display:block;text-decoration:none;color:inherit;border-color:color-mix(in srgb, var(--accent) 35%, var(--line))">
        <div class="chip-row" style="margin-bottom:8px"><span class="chip accent">15 phút</span><span class="chip">Miễn phí</span></div>
        <b>Chưa biết nên bắt đầu từ đâu?</b>
        <p class="muted small" style="margin:4px 0 0">Làm bài kiểm tra ngắn để biết trình độ và chuyên đề cần ôn trước →</p>
      </a>`;

  return `
    <section class="hero">
      <div>
        <div class="eyebrow">${loiChao()} · Toán vào lớp 10</div>
        <h1>Ôn chắc <span class="hl">7 điểm</span>, rồi tiến tới 10.</h1>
        <p class="lead">Đề thi thật của các tỉnh Tây Bắc, lời giải từng bước, luyện theo chuyên đề. Nhẹ, chạy được offline, không cần tài khoản.</p>
        <div class="hero-actions">
          <a class="btn primary" href="#/de">Xem đề thi ${catalog.length ? `<span class="chip" style="background:rgba(255,255,255,.18);color:inherit">${catalog.length}</span>` : ''}</a>
          <a class="btn" href="#/kiem-tra">Kiểm tra trình độ</a>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat"><b>${catalog.length}</b><span>đề đã đăng</span></div>
        <div class="stat"><b>${catalog.reduce((s, d) => s + (d.soY || d.soCau || 0), 0)}</b><span>câu hỏi có lời giải</span></div>
        <div class="stat"><b>${tk.soPhut}<small style="font-size:.55em"> phút</small></b><span>em đã luyện</span></div>
      </div>
    </section>

    ${continueHtml ? `<div style="margin-top:16px">${continueHtml}</div>` : ''}

    <section class="section">
      <div class="split two-col">
        <div>
          <div class="section-head"><h2>Vào nhanh</h2></div>
          <div class="quick-grid">
            <a class="quick-link" href="#/de"><span class="qi">▤</span><b>Đề thi</b><span>Lọc theo tỉnh, năm</span></a>
            <a class="quick-link" href="#/chuyen-de"><span class="qi">◎</span><b>Chuyên đề</b><span>7 chuyên đề, 3 mức</span></a>
            <a class="quick-link" href="#/so-loi"><span class="qi">✎</span><b>Sổ lỗi sai</b><span>${Object.keys(state.mistakes || {}).length} câu cần xem lại</span></a>
            <a class="quick-link" href="#/lo-trinh"><span class="qi">↗</span><b>Lộ trình</b><span>Checklist từng tuần</span></a>
          </div>
          <div style="margin-top:12px">${entryHtml}</div>
        </div>
        <div>
          <div class="section-head"><h2>Đề mới cập nhật</h2><a href="#/de">Tất cả →</a></div>
          ${deMoi.length
            ? `<div class="card exam-list">${deMoi.map((d) => examCard(d)).join('')}</div>`
            : emptyState({ icon: '📄', title: 'Chưa có đề nào', text: 'Hiện chưa có đề nào được đăng.', action: '<a class="btn primary" href="#/de">Xem danh sách</a>' })}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>Ôn theo chuyên đề</h2><a href="#/chuyen-de">Tất cả →</a></div>
      <div class="grid three">${topicTiles}</div>
    </section>

    ${roadmapHtml}

    <section class="section">
      <div class="card card-pad" style="background:linear-gradient(120deg,var(--brand-soft),var(--surface) 75%);border-color:transparent">
        <div class="split two-col" style="align-items:center">
          <div>
            <h2 style="margin-bottom:6px">Học trên điện thoại, mạng yếu vẫn chạy</h2>
            <p class="muted" style="margin:0">Cài web lên màn hình chính để mở offline. Tiến độ lưu trên máy em, có thể xuất file để mang sang máy khác.</p>
          </div>
          <div class="btn-row">
            <button class="btn primary" type="button" id="btn-install">Cài lên màn hình chính</button>
            <a class="btn" href="#/cai-dat">Cài đặt &amp; tiến độ</a>
          </div>
        </div>
      </div>
    </section>`;
}
