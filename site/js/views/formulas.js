import { taiCongThuc } from '../data.js';
import { escapeHtml } from '../utils.js';
import { renderMath } from '../math.js';

export async function congThuc() {
  const data = await taiCongThuc();
  const nhom = data.nhom || [];

  const toc = nhom.map((n) => `<a class="chip link" href="#/cong-thuc" data-cuon="${escapeHtml(n.ma)}">${escapeHtml(n.ten)}</a>`).join('');
  const blocks = nhom.map((n) => `
    <section class="card formula-block" id="ct-${escapeHtml(n.ma)}" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <span style="display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:var(--brand-soft);color:var(--brand);font-size:1.2rem;font-weight:800">${escapeHtml(n.icon || '∑')}</span>
        <h2 style="margin:0">${escapeHtml(n.ten)}</h2>
      </div>
      ${(n.muc || []).map((m) => `
        <div style="margin-top:12px">
          <h3>${escapeHtml(m.ten)}</h3>
          <ul class="formula-list">${(m.congThuc || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
          ${m.ghiChu ? `<p class="muted small" style="margin:6px 0 0">${escapeHtml(m.ghiChu)}</p>` : ''}
        </div>`).join('')}
      ${(n.loiThuongGap || []).length ? `
        <div class="formula-note">
          <b>Lỗi hay gặp</b>
          <ul style="margin:5px 0 0;padding-left:1.2em">${n.loiThuongGap.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        </div>` : ''}
    </section>`).join('');

  const html = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Mang theo khi ôn</div>
        <h1>Tờ công thức</h1>
        <p class="lead">Các công thức cần nhớ, xếp theo chuyên đề, kèm lỗi hay gặp. Có thể in ra để dán góc học tập.</p>
      </div>
      <div class="btn-row no-print">
        <button class="btn primary" type="button" id="btn-in-ct">In tờ công thức</button>
      </div>
    </div>
    <div class="toc no-print">${toc}</div>
    ${blocks}`;

  return {
    html,
    mount() {
      renderMath(document.getElementById('main'));
      document.getElementById('btn-in-ct')?.addEventListener('click', () => window.print());
      document.querySelectorAll('[data-cuon]').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          document.getElementById(`ct-${a.dataset.cuon}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    },
  };
}
