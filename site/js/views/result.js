import { taiDe, taiChuyenDe } from '../data.js';
import { getSession } from '../store.js';
import {
  nhanTrangThai, trangThaiCau, diemCuaDe, emptyState, nhanNgan,
} from '../components.js';
import { escapeHtml, rutGon, chiaSe, toast, dinhDangThoiGian, dinhDangDiem } from '../utils.js';

export async function ketQua({ params }) {
  const [exam, topics] = await Promise.all([taiDe(params.id), taiChuyenDe().catch(() => [])]);
  const session = getSession(exam.id);
  const topicMap = new Map(topics.map((t) => [t.ma, t]));

  if (!session?.completedAt) {
    return `<div class="page-head"><div><div class="eyebrow">Tổng kết</div><h1>Kết quả bài làm</h1></div></div>` + emptyState({
      icon: '📝',
      title: 'Chưa có kết quả',
      text: 'Em cần làm và nộp bài trước khi xem tổng kết.',
      action: `<a class="btn primary" href="#/de/${encodeURIComponent(exam.id)}">Mở đề này</a>`,
    });
  }

  const cauHoi = exam.cauHoi || [];
  const tongDiem = diemCuaDe(exam) || 1;
  const diem = cauHoi.reduce((sum, q) => {
    return trangThaiCau(session, q.id) === 'ok' ? sum + (Number(q.diem) || 0) : sum;
  }, 0);
  const dem = { ok: 0, bad: 0, unsure: 0, none: 0 };
  for (const q of cauHoi) dem[trangThaiCau(session, q.id)] += 1;
  const phanTram = Math.round((diem / tongDiem) * 100);

  let loiNhan = 'Cố lên em, mỗi câu làm lại là một bước tiến.';
  if (phanTram >= 85) loiNhan = 'Rất tốt! Em đã nắm chắc phần lớn nội dung. Giờ tập trung vào câu khó để lấy điểm 9–10.';
  else if (phanTram >= 65) loiNhan = 'Khá ổn. Em đã chắc phần cơ bản, cần luyện thêm vài dạng để ổn định điểm 7–8.';
  else if (phanTram >= 40) loiNhan = 'Em đang đi đúng hướng. Ưu tiên ôn lại các câu Nền tảng và làm lại các câu sai.';
  else if (phanTram >= 15) loiNhan = 'Đừng lo, hãy bắt đầu từ các câu Nền tảng. Làm lại từng câu và đọc lời giải là sẽ tiến bộ nhanh.';

  const topicStats = new Map();
  for (const q of cauHoi) {
    const st = trangThaiCau(session, q.id);
    const cur = topicStats.get(q.chuyenDe) || { ok: 0, bad: 0, unsure: 0, none: 0, tong: 0, diem: 0, diemDat: 0 };
    cur[st] += 1;
    cur.tong += 1;
    cur.diem += Number(q.diem) || 0;
    if (st === 'ok') cur.diemDat += Number(q.diem) || 0;
    topicStats.set(q.chuyenDe, cur);
  }
  const topicRows = [...topicStats.entries()]
    .sort((a, b) => (a[1].diemDat / (a[1].diem || 1)) - (b[1].diemDat / (b[1].diem || 1)))
    .map(([ma, v]) => {
      const t = topicMap.get(ma);
      const n = v.tong || 1;
      const pctOk = Math.round((v.ok / n) * 100);
      const pctUnsure = Math.round((v.unsure / n) * 100);
      const pctBad = Math.round((v.bad / n) * 100);
      const pctNone = Math.max(0, 100 - pctOk - pctUnsure - pctBad);
      return `
        <div class="bar-row">
          <div class="bar-top">
            <span>${escapeHtml(t?.ten || ma)} <span class="muted tiny">(${v.tong} câu)</span></span>
            <span class="muted">${dinhDangDiem(v.diemDat)}/${dinhDangDiem(v.diem)} đ</span>
          </div>
          <div class="bar-track">
            <i class="b-ok" style="width:${pctOk}%"></i>
            <i class="b-unsure" style="width:${pctUnsure}%"></i>
            <i class="b-bad" style="width:${pctBad}%"></i>
            <i class="b-none" style="width:${pctNone}%"></i>
          </div>
        </div>`;
    }).join('');

  const yeuNhat = (dem.bad + dem.unsure) > 0
    ? [...topicStats.entries()]
      .filter(([, v]) => v.tong > 0)
      .sort((a, b) => (a[1].diemDat / (a[1].diem || 1)) - (b[1].diemDat / (b[1].diem || 1)))[0]
    : null;

  const dsCau = cauHoi.map((q) => {
    const st = trangThaiCau(session, q.id);
    const ns = nhanTrangThai(st);
    return `<a class="result-item" href="#/cau/${encodeURIComponent(exam.id)}/${encodeURIComponent(q.id)}">
      <span class="num">${escapeHtml(nhanNgan(q))}</span>
      <span class="txt">${escapeHtml(rutGon(q.deBai, 95))}</span>
      <span class="st ${ns.lop}">${ns.chu}</span>
    </a>`;
  }).join('');

  const soCauSai = dem.bad + dem.unsure;
  const html = `
    <p class="small" style="margin-bottom:12px"><a href="#/de/${encodeURIComponent(exam.id)}">← Về đề</a></p>
    <div class="page-head">
      <div>
        <div class="eyebrow">Tổng kết</div>
        <h1>Kết quả bài làm</h1>
        <p class="lead">${escapeHtml(exam.tinh || '')} ${exam.nam || ''} — ${escapeHtml(exam.tieuDe || '')}</p>
      </div>
    </div>
    <section class="card score-hero">
      <div>
        <div class="eyebrow">Kết quả tạm tính</div>
        <div class="big-score">${dinhDangDiem(diem)}<small>/${dinhDangDiem(tongDiem)} điểm</small></div>
      </div>
      <div style="flex:1;min-width:220px">
        <div class="chip-row" style="margin-bottom:8px">
          <span class="chip brand">${escapeHtml(exam.tinh || '')} ${exam.nam || ''}</span>
          ${session.hetGio ? '<span class="chip danger">Hết giờ</span>' : ''}
          <span class="chip">${dinhDangThoiGian(session.elapsed || 0)}</span>
        </div>
        <p style="margin:0 0 4px;font-weight:650">${escapeHtml(loiNhan)}</p>
        <p class="score-note">Điểm gồm các câu em tự chấm “Đúng”; câu tự luận do em tự đánh giá nên chỉ mang tính tham khảo.</p>
      </div>
    </section>

    <div class="result-stats" style="margin-top:14px">
      <div class="result-stat ok"><b>${dem.ok}</b><span>Đúng</span></div>
      <div class="result-stat bad"><b>${dem.bad}</b><span>Sai</span></div>
      <div class="result-stat unsure"><b>${dem.unsure}</b><span>Chưa chắc</span></div>
      <div class="result-stat"><b>${dem.none}</b><span>Chưa làm</span></div>
    </div>

    <div class="split two-col" style="margin-top:22px">
      <div>
        <div class="card card-pad">
          <h2 style="font-size:1.05rem">Theo chuyên đề</h2>
          <p class="muted small">Nhìn nhanh phần nào em đã chắc, phần nào cần ôn lại.</p>
          ${topicRows || '<p class="muted">Chưa có dữ liệu.</p>'}
          ${yeuNhat ? `<p class="small" style="margin:10px 0 0">Nên ôn trước: <a href="#/chuyen-de/${encodeURIComponent(yeuNhat[0])}"><b>${escapeHtml(topicMap.get(yeuNhat[0])?.ten || yeuNhat[0])}</b></a>.</p>` : ''}
        </div>
        <div class="card card-pad" style="margin-top:14px">
          <h2 style="font-size:1.05rem">Chi tiết từng câu</h2>
          <div class="result-list" style="margin-top:10px">${dsCau}</div>
        </div>
      </div>
      <div>
        <div class="card card-pad" style="position:sticky;top:calc(var(--topbar-h) + 14px)">
          <h2 style="font-size:1.05rem">Làm gì tiếp?</h2>
          <div style="display:grid;gap:9px">
            ${soCauSai ? `<a class="btn primary" href="#/luyen?de=${encodeURIComponent(exam.id)}&amp;sai=1">Làm lại ${soCauSai} câu sai / chưa chắc</a>` : ''}
            ${yeuNhat ? `<a class="btn" href="#/chuyen-de/${encodeURIComponent(yeuNhat[0])}">Ôn chuyên đề yếu</a>` : ''}
            <a class="btn" href="#/in/${encodeURIComponent(exam.id)}?kq=1">In kết quả</a>
            <button class="btn" type="button" id="btn-share-kq">Chia sẻ kết quả</button>
            <a class="btn ghost" href="#/de/${encodeURIComponent(exam.id)}">Về trang đề</a>
          </div>
          <p class="file-note">Sổ lỗi sai đã tự cập nhật các câu sai / chưa chắc.</p>
        </div>
      </div>
    </div>`;

  return {
    html,
    mount() {
      document.getElementById('btn-share-kq')?.addEventListener('click', async () => {
        const kq = await chiaSe({
          tieuDe: `Kết quả: ${exam.tieuDe}`,
          noiDung: `${dinhDangDiem(diem)}/${dinhDangDiem(tongDiem)} điểm — cùng luyện trên Trạm tiếp sức Toán vào 10`,
          hash: `#/ket-qua/${encodeURIComponent(exam.id)}`,
        });
        if (kq === 'copied') toast('Đã chép nội dung chia sẻ.');
      });
    },
  };
}
