import { taiLoTrinh } from '../data.js';
import { docChecklist, batTatChecklist } from '../store.js';
import { escapeHtml, moHopThoai, toast } from '../utils.js';
import { renderMath } from '../math.js';

export async function loTrinh() {
  const data = await taiLoTrinh();
  const tuan = data.tuan || [];
  const checked = docChecklist();
  const tongViec = tuan.reduce((s, t) => s + (t.viec || []).length, 0);

  function demTuan(t) {
    const viec = t.viec || [];
    return viec.filter((v) => checked[v.ma]).length;
  }
  function demTatCa() {
    return tuan.reduce((s, t) => s + demTuan(t), 0);
  }

  const weekCards = tuan.map((t) => {
    const xong = demTuan(t);
    const tong = (t.viec || []).length;
    const hoanThanh = xong === tong && tong > 0;
    return `
      <details class="card week-card" data-week="${t.so}">
        <summary>
          <span class="wnum">${hoanThanh ? '✓' : t.so}</span>
          <span class="grow">
            <b>Tuần ${t.so}: ${escapeHtml(t.ten)}</b>
            <span>${escapeHtml(t.moTa || '')}</span>
          </span>
          <span class="chip ${hoanThanh ? 'ok' : ''}" data-week-count>${xong}/${tong}</span>
        </summary>
        <div class="week-body">
          <ul class="check-list">
            ${(t.viec || []).map((v) => `
              <li>
                <input type="checkbox" id="chk-${escapeHtml(v.ma)}" data-viec="${escapeHtml(v.ma)}" ${checked[v.ma] ? 'checked' : ''}>
                <label for="chk-${escapeHtml(v.ma)}">${escapeHtml(v.ten)}</label>
              </li>`).join('')}
          </ul>
        </div>
      </details>`;
  }).join('');

  const html = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Đi từng bước</div>
        <h1>Lộ trình ôn thi</h1>
        <p class="lead">${escapeHtml(data.gioiThieu || '')}</p>
      </div>
      <div class="btn-row no-print">
        <button class="btn" type="button" id="btn-in-lt">In checklist</button>
      </div>
    </div>

    <div class="card card-pad" style="margin-bottom:16px;background:linear-gradient(120deg,var(--brand-soft),var(--surface) 70%);border-color:transparent">
      <div class="split two-col" style="align-items:center">
        <div>
          <div class="eyebrow" style="margin-bottom:4px">Tiến độ của em</div>
          <div style="display:flex;align-items:baseline;gap:8px">
            <span style="font-size:2rem;font-weight:800;color:var(--brand)" id="lt-done">${demTatCa()}</span>
            <span class="muted">/ ${tongViec} việc đã xong</span>
          </div>
          <p class="muted small" style="margin:4px 0 0" id="lt-note"></p>
        </div>
        <div>
          <div class="progressbar" style="height:10px"><i id="lt-bar" style="width:${Math.round((demTatCa() / (tongViec || 1)) * 100)}%"></i></div>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn small ghost" type="button" id="btn-reset-lt">Đặt lại checklist</button>
          </div>
        </div>
      </div>
    </div>

    ${weekCards}

    <p class="muted small" style="margin-top:16px">Gợi ý: mỗi ngày 45 phút, 5 ngày mỗi tuần. Nếu bận, kéo dài lộ trình thành 12 tuần — quan trọng là học đều, không học dồn.</p>`;

  return {
    html,
    mount() {
      renderMath(document.getElementById('main'));
      const capNhat = () => {
        const all = demTatCa();
        const doneEl = document.getElementById('lt-done');
        if (doneEl) doneEl.textContent = all;
        const bar = document.getElementById('lt-bar');
        if (bar) bar.style.width = `${Math.round((all / (tongViec || 1)) * 100)}%`;
        const note = document.getElementById('lt-note');
        if (note) {
          const pct = Math.round((all / (tongViec || 1)) * 100);
          note.textContent = pct === 100 ? 'Em đã hoàn thành toàn bộ lộ trình. Chúc em thi tốt!' : `Đã hoàn thành ${pct}% lộ trình. Cố gắng đều mỗi ngày nhé.`;
        }
        tuan.forEach((t) => {
          const xong = demTuan(t);
          const tong = (t.viec || []).length;
          const card = document.querySelector(`[data-week="${t.so}"]`);
          const count = card?.querySelector('[data-week-count]');
          if (count) count.textContent = `${xong}/${tong}`;
          if (card) {
            const wn = card.querySelector('.wnum');
            if (wn) wn.textContent = xong === tong && tong > 0 ? '✓' : String(t.so);
            count?.classList.toggle('ok', xong === tong && tong > 0);
          }
        });
      };
      capNhat();

      document.querySelectorAll('[data-viec]').forEach((chk) => {
        chk.addEventListener('change', () => {
          batTatChecklist(chk.dataset.viec);
          checked[chk.dataset.viec] = chk.checked;
          capNhat();
        });
      });

      document.getElementById('btn-in-lt')?.addEventListener('click', () => window.print());

      document.getElementById('btn-reset-lt')?.addEventListener('click', async () => {
        const ok = await moHopThoai({
          tieuDe: 'Đặt lại checklist?',
          noiDung: 'Toàn bộ dấu đã đánh trong lộ trình sẽ bị xoá. Sổ lỗi và bài làm vẫn giữ nguyên.',
          dongY: 'Đặt lại',
          nguyHiem: true,
        });
        if (!ok) return;
        document.querySelectorAll('[data-viec]').forEach((chk) => {
          if (chk.checked) { chk.checked = false; batTatChecklist(chk.dataset.viec); }
          checked[chk.dataset.viec] = false;
        });
        capNhat();
        toast('Đã đặt lại checklist.');
      });
    },
  };
}
