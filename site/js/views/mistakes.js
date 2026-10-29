import { taiChuyenDe } from '../data.js';
import { dsLoiSai, xoaLoiSai } from '../store.js';
import { emptyState, noiDung, nhanNgan } from '../components.js';
import { escapeHtml, toast, moHopThoai } from '../utils.js';
import { renderMath } from '../math.js';

export async function soLoi() {
  const topics = await taiChuyenDe().catch(() => []);
  const topicMap = new Map(topics.map((t) => [t.ma, t]));
  let mistakes = dsLoiSai();
  let loc = '';

  const html = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Học từ lỗi sai</div>
        <h1>Sổ lỗi sai</h1>
        <p class="lead">Mọi câu em làm sai hoặc chưa chắc đều được ghi lại. Làm lại cho đến khi đúng, rồi xoá khỏi sổ.</p>
      </div>
      <div class="btn-row">
        ${mistakes.length ? `<a class="btn primary" href="#/luyen?loi=1">Luyện tất cả (${mistakes.length})</a>` : ''}
        <a class="btn" href="#/de">Làm đề mới</a>
      </div>
    </div>
    <div id="loi-body"></div>`;

  function ve() {
    const body = document.getElementById('loi-body');
    if (!body) return;
    if (!mistakes.length) {
      body.innerHTML = emptyState({
        icon: '✨',
        title: 'Sổ lỗi đang trống',
        text: 'Khi làm bài, câu sai hoặc “chưa chắc” sẽ tự động được ghi vào đây để em xem lại.',
        action: '<a class="btn primary" href="#/de">Làm đề đầu tiên</a>',
      });
      return;
    }
    const demTopic = new Map();
    for (const m of mistakes) demTopic.set(m.chuyenDe, (demTopic.get(m.chuyenDe) || 0) + 1);
    const ds = loc ? mistakes.filter((m) => m.chuyenDe === loc) : mistakes;

    body.innerHTML = `
      <div class="chip-row" style="margin-bottom:14px">
        <button class="chip link ${loc === '' ? 'brand' : ''}" type="button" data-loc="">Tất cả (${mistakes.length})</button>
        ${[...demTopic.entries()].map(([ma, n]) => `<button class="chip link ${loc === ma ? 'brand' : ''}" type="button" data-loc="${escapeHtml(ma)}">${escapeHtml(topicMap.get(ma)?.ten || ma)} (${n})</button>`).join('')}
      </div>
      <div class="card" style="overflow:hidden">
        ${ds.map((m) => `
          <div class="mistake-item" data-key="${escapeHtml(m.examId)}::${escapeHtml(m.qid)}">
            <div class="grow">
              <div class="chip-row" style="margin-bottom:6px">
                <span class="chip brand">Câu ${escapeHtml(nhanNgan(m))}</span>
                <span class="chip">${escapeHtml(m.examTitle || '')}</span>
                <span class="chip">${escapeHtml(topicMap.get(m.chuyenDe)?.ten || m.chuyenDe || '')}</span>
                <span class="chip danger">Sai ${m.count || 1} lần</span>
              </div>
              <div class="qtext">${noiDung(m)}</div>
              <div class="meta">
                <span>${escapeHtml(m.examTitle || '')}</span>
                ${m.lastAt ? `<span>Lần cuối: ${new Date(m.lastAt).toLocaleDateString('vi-VN')}</span>` : ''}
              </div>
            </div>
            <div class="acts">
              <a class="btn small primary" href="#/cau/${encodeURIComponent(m.examId)}/${encodeURIComponent(m.qid)}">Làm lại</a>
              <button class="btn small ghost" type="button" data-xoa="${escapeHtml(m.examId)}::${escapeHtml(m.qid)}">Xoá</button>
            </div>
          </div>`).join('')}
      </div>
      <p class="muted small" style="margin-top:12px">Mẹo: làm lại câu sai ngay trong ngày sẽ nhớ lâu hơn. Đừng xoá sổ khi chưa làm đúng lại ít nhất một lần.</p>`;

    renderMath(body);
    body.querySelectorAll('[data-loc]').forEach((b) => {
      b.addEventListener('click', () => { loc = b.dataset.loc; ve(); });
    });
    body.querySelectorAll('[data-xoa]').forEach((b) => {
      b.addEventListener('click', async () => {
        const [examId, qid] = b.dataset.xoa.split('::');
        const ok = await moHopThoai({
          tieuDe: 'Xoá câu này khỏi sổ lỗi?',
          noiDung: 'Chỉ nên xoá khi em đã làm lại và hiểu bài.',
          dongY: 'Xoá',
          nguyHiem: true,
        });
        if (!ok) return;
        xoaLoiSai(examId, qid);
        mistakes = dsLoiSai();
        toast('Đã xoá khỏi sổ lỗi.');
        ve();
      });
    });
  }

  return { html, mount() { ve(); } };
}
