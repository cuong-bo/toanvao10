import { taiDe } from '../data.js';
import { getSession } from '../store.js';
import { noiDung, hinhAnh, nhanCau, chipMucDo, diemCuaDe, nhanTrangThai, trangThaiCau } from '../components.js';
import { escapeHtml, dinhDangDiem } from '../utils.js';
import { renderMath } from '../math.js';

export async function inDe({ params, query }) {
  const exam = await taiDe(params.id);
  const session = getSession(exam.id);
  const kemKetQua = query.kq === '1' && session?.completedAt;
  const cauHoi = exam.cauHoi || [];
  const tongDiem = diemCuaDe(exam);

  const html = `
    <div class="print-toolbar no-print">
      <div class="grow">
        <b>Bản in — ${escapeHtml(exam.tieuDe)}</b>
        <div class="muted small">Chọn “In / Xuất PDF” rồi chọn máy in hoặc “Lưu dưới dạng PDF”.</div>
      </div>
      <label class="chip link" style="cursor:pointer"><input type="checkbox" id="chk-loi"> Kèm lời giải</label>
      <button class="btn primary" type="button" id="btn-print">In / Xuất PDF</button>
      <a class="btn" href="#/de/${encodeURIComponent(exam.id)}">Quay lại</a>
    </div>
    <div class="card card-pad">
      <div class="print-head">
        <h1>${escapeHtml(exam.tieuDe)}</h1>
        <div class="sub">${escapeHtml(exam.tinh || '')} — Năm ${exam.nam || ''}</div>
      </div>
      <div class="print-meta">
        <span>Thời gian: ${exam.thoiGian || 90} phút</span>
        <span>Thang điểm: ${dinhDangDiem(tongDiem)}</span>
        <span>Họ tên: ................................................</span>
      </div>
      ${kemKetQua ? `
        <div class="chip-row" style="margin-bottom:12px">
          <span class="chip brand">Kết quả bài làm: ${dinhDangDiem(session.score || 0)}/${dinhDangDiem(tongDiem)} điểm</span>
          <span class="chip">${session.hetGio ? 'Hết giờ' : 'Đã nộp'}</span>
        </div>` : ''}
      <div id="print-body"></div>
      <div class="print-footer">Trạm tiếp sức Toán vào 10 — đề được đăng với nguồn ghi rõ. Lời giải do nhóm biên soạn, có thể sai; hãy kiểm tra và hỏi giáo viên nếu thắc mắc.</div>
    </div>`;

  function veBody(kemLoi) {
    const body = document.getElementById('print-body');
    body.innerHTML = cauHoi.map((q) => {
      const st = kemKetQua ? nhanTrangThai(trangThaiCau(session, q.id)) : null;
      return `
        <div class="qcard print-q">
          <div class="qhead">
            <div class="qnum">${escapeHtml(nhanCau(q))}</div>
            <div class="grow qmeta">${chipMucDo(q.mucDo)}<span class="chip">${q.diem ?? ''} điểm</span>${st ? `<span class="chip ${st.lop}">${st.chu}</span>` : ''}</div>
          </div>
          <div class="qbody">${noiDung(q)}</div>
          ${hinhAnh(q)}
          ${q.loai === 'tracnghiem' && q.phuongAn?.length ? `
            <div class="print-options">
              ${q.phuongAn.map((pa) => `<div><b>${escapeHtml(pa.ma)}.</b> ${escapeHtml(pa.noiDung)}</div>`).join('')}
            </div>` : ''}
          ${kemLoi ? `
            <div class="solution">
              <h4>Lời giải</h4>
              <ol>${(q.loiGiai || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ol>
              ${q.dapAn?.length ? `<div class="dapan"><b>Đáp án:</b> ${escapeHtml(q.dapAn.join('; '))}</div>` : ''}
            </div>` : `<div class="print-space" style="height:${q.loai === 'tracnghiem' ? 2 : q.loai === 'dapanso' ? 18 : 50}mm"></div>`}
        </div>`;
    }).join('');
    renderMath(body);
  }

  return {
    html,
    mount() {
      veBody(false);
      document.getElementById('btn-print')?.addEventListener('click', () => window.print());
      document.getElementById('chk-loi')?.addEventListener('change', (e) => veBody(e.target.checked));
    },
  };
}
