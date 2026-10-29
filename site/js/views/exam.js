import { taiDe, taiChuyenDe } from '../data.js';
import { chipMucDo, dongThongTinDe, diemCuaDe } from '../components.js';
import { getSession, getSettings, setSetting, xoaPhien } from '../store.js';
import { escapeHtml, chiaSe, toast, moHopThoai, dinhDangThoiGian, dinhDangDiem } from '../utils.js';
import { soCauDaLam as demCau } from '../components.js';

export async function gioiThieuDe({ params }) {
  const [exam, topics] = await Promise.all([taiDe(params.id), taiChuyenDe().catch(() => [])]);
  const topicMap = new Map(topics.map((t) => [t.ma, t]));
  const meta = exam._meta || exam;
  const session = getSession(exam.id);
  const timerDefault = getSettings().timerDefault !== false;
  const tongDiem = diemCuaDe(exam);

  const theoTopic = new Map();
  for (const q of exam.cauHoi || []) {
    const cur = theoTopic.get(q.chuyenDe) || { soCau: 0, diem: 0 };
    cur.soCau += 1;
    cur.diem += Number(q.diem) || 0;
    theoTopic.set(q.chuyenDe, cur);
  }
  const topicRows = [...theoTopic.entries()]
    .map(([ma, v]) => {
      const t = topicMap.get(ma);
      return `<div class="bar-row">
        <div class="bar-top"><span>${escapeHtml(t?.ten || ma)}</span><span class="muted">${v.soCau} câu · ${v.diem} đ</span></div>
        <div class="bar-track"><i style="width:${Math.round((v.diem / (tongDiem || 1)) * 100)}%;background:${t?.mau || 'var(--brand)'}"></i></div>
      </div>`;
    }).join('');

  const soY = (exam.cauHoi || []).length;
  const baiDaLam = session ? demCau(session) : 0;
  const soTracNghiem = (exam.cauHoi || []).filter((q) => q.loai === 'tracnghiem').length;
  const soTuLuan = (exam.cauHoi || []).filter((q) => q.loai === 'tuluan').length;
  const hinhThuc = soTracNghiem === soY
    ? 'Trắc nghiệm'
    : soTracNghiem > 0
      ? (soTuLuan ? 'Trắc nghiệm + tự luận' : 'Trắc nghiệm + trả lời ngắn')
      : (soTuLuan ? 'Tự luận' : 'Trả lời ngắn');
  const dangLam = Boolean(session && !session.completedAt);
  const daXong = Boolean(session?.completedAt);
  const nutChinh = daXong
    ? { chu: 'Xem kết quả', href: `#/ket-qua/${encodeURIComponent(exam.id)}` }
    : dangLam
      ? { chu: 'Tiếp tục làm', href: `#/lam/${encodeURIComponent(exam.id)}` }
      : { chu: 'Bắt đầu làm', href: `#/lam/${encodeURIComponent(exam.id)}?moi=1&hct=${timerDefault ? 1 : 0}` };

  let trangThaiHtml = '';
  if (session?.completedAt) {
    trangThaiHtml = `
      <div class="card card-pad" style="border-color:var(--ok);background:var(--ok-soft);margin-bottom:14px">
        <div class="chip-row"><span class="chip ok">Đã hoàn thành</span><span class="chip">${escapeHtml(String(session.completedAt).slice(0, 10))}</span></div>
        <h3 style="margin:8px 0 4px">Em đã làm đề này</h3>
        <p class="muted small" style="margin:0 0 10px">Điểm tự đánh giá: <b>${dinhDangDiem(session.score ?? 0)}/${dinhDangDiem(tongDiem)}</b> · ${baiDaLam}/${soY} câu đã làm.</p>
        <div class="btn-row">
          <a class="btn primary small" href="#/ket-qua/${encodeURIComponent(exam.id)}">Xem kết quả</a>
          <button class="btn small" type="button" id="lam-lai">Làm lại từ đầu</button>
        </div>
      </div>`;
  } else if (session) {
    trangThaiHtml = `
      <div class="card card-pad" style="border-color:var(--accent);margin-bottom:14px">
        <div class="chip-row"><span class="chip accent">Đang làm dở</span><span class="chip">${baiDaLam}/${soY} câu</span>${session.timer ? `<span class="chip">Còn ${dinhDangThoiGian(session.remaining || 0)}</span>` : ''}</div>
        <h3 style="margin:8px 0 4px">Tiếp tục bài đang làm?</h3>
        <p class="muted small" style="margin:0 0 10px">Tiến độ đã được lưu trên máy này.</p>
        <div class="btn-row">
          <a class="btn primary small" href="#/lam/${encodeURIComponent(exam.id)}">Tiếp tục làm</a>
          <button class="btn small" type="button" id="lam-lai">Làm lại từ đầu</button>
        </div>
      </div>`;
  }

  const html = `
    <p class="small" style="margin-bottom:12px"><a href="#/de">← Danh sách đề</a></p>
    <section class="card exam-hero">
      <div class="chip-row" style="margin-bottom:10px">
        <span class="chip brand">${escapeHtml(exam.tinh || meta.tinh || '')}</span>
        <span class="chip">Năm ${exam.nam || meta.nam || ''}</span>
        ${exam.deMau ? '<span class="chip accent">Đề mẫu — không phải đề thật</span>' : ''}
      </div>
      <h1>${escapeHtml(exam.tieuDe || meta.tieuDe || '')}</h1>
      ${exam.ghiChu ? `<p class="muted small">${escapeHtml(exam.ghiChu)}</p>` : ''}
      <div class="meta-table">
        <div class="meta-box"><span>Thời gian</span><b>${exam.thoiGian || meta.thoiGian || 90} phút</b></div>
        <div class="meta-box"><span>Số câu</span><b>${soY} ý / ${new Set((exam.cauHoi || []).map((q) => q.soCau)).size} câu</b></div>
        <div class="meta-box"><span>Thang điểm</span><b>${dinhDangDiem(tongDiem)} điểm</b></div>
        <div class="meta-box"><span>Hình thức</span><b>${hinhThuc}</b></div>
      </div>
      <p class="small muted" style="margin:0">Nguồn: ${dongThongTinDe({ ...meta, nguon: exam.nguon || meta.nguon })}</p>
      <p class="file-note">Lời giải do nhóm biên soạn, có thể sai. Em hãy kiểm tra lại và hỏi giáo viên nếu thắc mắc.</p>
    </section>

    <div class="split two-col" style="margin-top:16px">
      <div>
        ${trangThaiHtml}
        <div class="card card-pad">
          <h2 style="font-size:1.05rem">Cấu trúc đề</h2>
          <p class="muted small">Các câu được chia theo chuyên đề và mức độ. Em có thể mở gợi ý từng nấc khi bí.</p>
          ${topicRows || '<p class="muted">Chưa có thông tin chuyên đề.</p>'}
          <div class="chip-row" style="margin-top:14px">
            ${[...new Set((exam.cauHoi || []).map((q) => q.mucDo))].sort().map((m) => chipMucDo(m)).join('')}
          </div>
        </div>
      </div>
      <div>
        <div class="card card-pad" style="position:sticky;top:calc(var(--topbar-h) + 14px)">
          <h2 style="font-size:1.05rem">Bắt đầu làm bài</h2>
          <div class="toggle-row" style="padding-top:0;border-top:0;${session ? 'display:none' : ''}">
            <div>
              <b>Bấm giờ</b>
              <span>${exam.thoiGian || meta.thoiGian || 90} phút, tự nộp khi hết giờ</span>
            </div>
            <label class="switch"><input type="checkbox" id="chk-timer" ${timerDefault ? 'checked' : ''} aria-label="Bật đồng hồ bấm giờ"><i></i></label>
          </div>
          <a class="btn primary wide" id="btn-bat-dau" href="${nutChinh.href}">${nutChinh.chu}</a>
          <div class="btn-row" style="margin-top:10px">
            <a class="btn small" href="#/in/${encodeURIComponent(exam.id)}">In đề</a>
            <button class="btn small" type="button" id="btn-share">Chia sẻ</button>
          </div>
          <p class="file-note">Không cần đăng nhập. Tiến độ lưu trên máy em.</p>
        </div>
      </div>
    </div>`;

  return {
    html,
    mount() {
      const chk = document.getElementById('chk-timer');
      const btn = document.getElementById('btn-bat-dau');
      const capNhatLink = () => {
        if (!chk || !btn || session) return;
        setSetting('timerDefault', chk.checked);
        const q = new URLSearchParams({ moi: '1', hct: chk.checked ? '1' : '0' });
        btn.href = `#/lam/${encodeURIComponent(exam.id)}?${q}`;
      };
      if (chk) chk.addEventListener('change', capNhatLink);
      capNhatLink();

      document.getElementById('lam-lai')?.addEventListener('click', async () => {
        const ok = await moHopThoai({
          tieuDe: 'Làm lại từ đầu?',
          noiDung: 'Các câu đã làm và kết quả cũ của đề này sẽ bị xoá. Sổ lỗi sai vẫn giữ nguyên.',
          dongY: 'Xoá và làm lại',
          nguyHiem: true,
        });
        if (!ok) return;
        xoaPhien(exam.id);
        location.hash = `#/lam/${encodeURIComponent(exam.id)}?moi=1&hct=${getSettings().timerDefault !== false ? 1 : 0}`;
      });

      document.getElementById('btn-share')?.addEventListener('click', async () => {
        const kq = await chiaSe({
          tieuDe: exam.tieuDe || 'Đề thi Toán vào 10',
          noiDung: `${exam.tinh || ''} ${exam.nam || ''} — làm trên Trạm tiếp sức Toán vào 10`,
          hash: `#/de/${encodeURIComponent(exam.id)}`,
        });
        if (kq === 'copied') toast('Đã chép link để gửi qua Zalo.');
        else if (kq === 'failed') toast('Không chép được link, em hãy sao chép trên thanh địa chỉ.');
      });
    },
  };
}
