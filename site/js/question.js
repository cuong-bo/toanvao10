// Thẻ câu hỏi dùng trong làm bài, luyện tập và xem lại

import { renderMath, kiemTraDapAn, hienThiDapAn } from './math.js';
import { noiDung, hinhAnh, nhanCau, chipMucDo, MUC_DO } from './components.js';
import { getSession, ghiDapAn, datCo, themLoiSai, xoaLoiSai } from './store.js';
import { escapeHtml, toast } from './utils.js';

let demUid = 0;

function layTopicTen(q) {
  return q._tenNgan || q._tenChuyenDe || q.chuyenDe || '';
}

export function thongTinLoi(q, exam) {
  return {
    examId: q.examId || exam?.id || '',
    examTitle: q.examTitle || exam?.tieuDe || '',
    qid: q.id,
    soCau: q.soCau,
    y: q.y || '',
    chuyenDe: q.chuyenDe,
    mucDo: q.mucDo,
    deBai: q.deBai,
    hinhAnh: q.hinhAnh || null,
  };
}

/**
 * Tạo HTML một thẻ câu hỏi.
 * opts: { answer, flagged, mode: 'exam'|'practice'|'review'|'single' }
 */
export function htmlTheCau(q, exam, opts = {}) {
  const uid = `qc${++demUid}`;
  const a = opts.answer || {};
  const status = a.status || 'none';
  const muc = MUC_DO[q.mucDo] || MUC_DO[1];
  const tenTopic = layTopicTen(q);

  const feedback = status === 'ok'
    ? `<div class="answer-feedback ok" data-fb>Chính xác! Em giữ vững phong độ nhé.</div>`
    : status === 'bad'
      ? `<div class="answer-feedback bad" data-fb>Chưa đúng. Em xem gợi ý hoặc thử lại, rồi mở lời giải để hiểu vì sao.</div>`
      : status === 'unsure'
        ? `<div class="answer-feedback info" data-fb>Em đã đánh dấu “chưa chắc”. Câu này sẽ vào sổ lỗi để xem lại.</div>`
        : '<div data-fb></div>';

  const answerArea = q.loai === 'tracnghiem'
    ? `<div class="answer-area">
        <div class="answer-label">Chọn đáp án đúng</div>
        <div class="options" role="group" aria-label="Phương án trả lời ${escapeHtml(nhanCau(q))}">
          ${(q.phuongAn || []).map((pa) => `
            <button class="opt-btn ${a.value === pa.ma ? 'selected' : ''}" type="button" data-opt="${escapeHtml(pa.ma)}">
              <span class="opt-ma">${escapeHtml(pa.ma)}</span>
              <span class="opt-noi">${escapeHtml(pa.noiDung)}</span>
            </button>`).join('')}
        </div>
        ${feedback}
      </div>`
    : q.loai === 'dapanso'
    ? `<div class="answer-area">
        <div class="answer-label">Nhập đáp án</div>
        <div class="answer-inline">
          <input class="input" type="text" inputmode="text" autocomplete="off" spellcheck="false"
            placeholder="Ví dụ: 1/2 hoặc 0,5" value="${escapeHtml(a.value || '')}" aria-label="Đáp án ${escapeHtml(nhanCau(q))}">
          <button class="btn primary" type="button" data-check>Kiểm tra</button>
        </div>
        <p class="file-note">Chấp nhận phân số, số thập phân (dấu phẩy hoặc dấu chấm), căn thức đơn giản.</p>
        ${feedback}
      </div>`
    : `<div class="answer-area">
        <div class="answer-label">Em tự chấm bài của mình</div>
        <div class="selfcheck">
          <button class="btn small ${status === 'ok' ? 'sel-ok' : ''}" type="button" data-self="ok">✓ Đúng</button>
          <button class="btn small ${status === 'bad' ? 'sel-bad' : ''}" type="button" data-self="bad">✗ Sai</button>
          <button class="btn small ${status === 'unsure' ? 'sel-unsure' : ''}" type="button" data-self="unsure">? Chưa chắc</button>
        </div>
        ${feedback}
      </div>`;

  const hints = Array.isArray(q.goiY) ? q.goiY.filter(Boolean) : [];
  const hintButtons = opts.hideHelp
    ? ''
    : hints.length
    ? `<div class="btn-row" data-hint-btns>
        <button class="btn small ghost" type="button" data-hint>Gợi ý 1/${hints.length}</button>
        <button class="btn small ghost" type="button" data-solution>Xem lời giải</button>
      </div>`
    : `<div class="btn-row"><button class="btn small ghost" type="button" data-solution>Xem lời giải</button></div>`;

  return `
    <article class="card qcard" data-qid="${escapeHtml(q.id)}" data-uid="${uid}">
      <header class="qhead">
        <div class="qnum">${escapeHtml(nhanCau(q))}</div>
        <div class="grow">
          <div class="qmeta">
            <span class="chip brand">${escapeHtml(tenTopic)}</span>
            ${chipMucDo(q.mucDo)}
            <span class="chip">${q.diem ?? ''} điểm</span>
            ${q.loai === 'dapanso' ? '<span class="chip">Đáp án số</span>' : q.loai === 'tracnghiem' ? '<span class="chip">Trắc nghiệm</span>' : '<span class="chip">Tự luận</span>'}
          </div>
        </div>
        <button class="btn small ghost flag-btn ${opts.flagged ? 'on' : ''}" type="button" data-flag
          aria-pressed="${opts.flagged ? 'true' : 'false'}" title="Đánh dấu câu cần xem lại">⚑</button>
      </header>
      <div class="qbody">${noiDung(q)}</div>
      ${hinhAnh(q)}
      ${answerArea}
      <div class="hint-zone" data-hint-zone hidden></div>
      ${opts.hideHelp ? '' : `<div class="solution" data-solution-box hidden>
        <h4>Lời giải từng bước</h4>
        <ol>${(q.loiGiai || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ol>
        ${q.dapAn?.length ? `<div class="dapan"><b>Đáp án:</b> ${escapeHtml(hienThiDapAn(q.dapAn))}</div>` : ''}
        <p class="file-note" style="margin:10px 0 0">Lời giải do nhóm biên soạn, có thể sai. Em hãy kiểm tra lại và hỏi giáo viên nếu thắc mắc.</p>
      </div>`}
      <div class="btn-row" style="margin-top:16px">${hintButtons}</div>
    </article>`;
}

/**
 * Gắn sự kiện cho thẻ câu hỏi.
 * ctx: { getAnswer, setAnswer, isFlagged, setFlag, onAnswer, onMistake, onCorrect, exam }
 */
export function ganTheCau(root, q, exam, ctx = {}) {
  const card = root.querySelector(`[data-qid="${CSS.escape(q.id)}"]`) || root.querySelector('.qcard');
  if (!card) return;
  const examId = q.examId || exam?.id;
  const getAnswer = ctx.getAnswer || (() => getSession(examId)?.answers?.[q.id] || {});
  const setAnswer = ctx.setAnswer || ((data) => ghiDapAn(examId, q.id, data));
  const isFlagged = ctx.isFlagged || (() => (getSession(examId)?.flags || []).includes(q.id));
  const setFlag = ctx.setFlag || ((bat) => datCo(examId, q.id, bat));
  const input = card.querySelector('input[type="text"]');
  const fb = card.querySelector('[data-fb]');
  const checkBtn = card.querySelector('[data-check]');
  const hintZone = card.querySelector('[data-hint-zone]');
  const hintBtn = card.querySelector('[data-hint]');
  const solBtn = card.querySelector('[data-solution]');
  const solBox = card.querySelector('[data-solution-box]');
  const flagBtn = card.querySelector('[data-flag]');
  const hints = (q.goiY || []).filter(Boolean);
  let soGoiY = 0;
  let daHienLoiGiai = false;

  const capNhatFb = (status) => {
    if (!fb) return;
    if (status === 'ok') fb.innerHTML = '<div class="answer-feedback ok">Chính xác! Em giữ vững phong độ nhé.</div>';
    else if (status === 'bad') fb.innerHTML = '<div class="answer-feedback bad">Chưa đúng. Em xem gợi ý hoặc thử lại, rồi mở lời giải để hiểu vì sao.</div>';
    else if (status === 'unsure') fb.innerHTML = '<div class="answer-feedback info">Em đã đánh dấu “chưa chắc”. Câu này sẽ vào sổ lỗi để xem lại.</div>';
    else fb.innerHTML = '';
  };

  const ghiNhan = (status, value) => {
    const data = { status };
    if (value !== undefined) data.value = value;
    else if (input) data.value = input.value.trim();
    setAnswer(data);
    capNhatFb(status);
    if (status === 'bad' || status === 'unsure') {
      if (ctx.onMistake) ctx.onMistake(q, status);
      else themLoiSai(thongTinLoi(q, exam));
    } else if (status === 'ok') {
      if (ctx.onCorrect) ctx.onCorrect(q);
      else xoaLoiSai(q.examId || exam?.id, q.id);
    }
    ctx.onAnswer?.(q, status);
  };

  // Khôi phục trạng thái
  const a = getAnswer();
  if (a?.status) {
    capNhatFb(a.status);
    card.querySelectorAll('[data-self]').forEach((b) => {
      b.classList.toggle('sel-ok', b.dataset.self === 'ok' && a.status === 'ok');
      b.classList.toggle('sel-bad', b.dataset.self === 'bad' && a.status === 'bad');
      b.classList.toggle('sel-unsure', b.dataset.self === 'unsure' && a.status === 'unsure');
    });
  }
  if (isFlagged()) { flagBtn?.classList.add('on'); flagBtn?.setAttribute('aria-pressed', 'true'); }

  // Câu trắc nghiệm: chọn là chấm ngay
  card.querySelectorAll('[data-opt]').forEach((btn) => {
    if (a?.value === btn.dataset.opt) {
      btn.classList.add('selected');
      if (a.status === 'ok') btn.classList.add('ok');
      if (a.status === 'bad') btn.classList.add('bad');
    }
    btn.addEventListener('click', () => {
      const ma = btn.dataset.opt;
      card.querySelectorAll('[data-opt]').forEach((b) => b.classList.remove('selected', 'ok', 'bad'));
      btn.classList.add('selected');
      const kq = kiemTraDapAn(ma, q.dapAn || []);
      btn.classList.add(kq.dung ? 'ok' : 'bad');
      ghiNhan(kq.dung ? 'ok' : 'bad', ma);
    });
  });

  checkBtn?.addEventListener('click', () => {
    const value = input?.value?.trim() || '';
    if (!value) { toast('Em nhập đáp án trước nhé.'); input?.focus(); return; }
    const kq = kiemTraDapAn(value, q.dapAn || []);
    if (kq.dung) {
      ghiNhan('ok');
      if (input) { input.style.borderColor = 'var(--ok)'; }
    } else {
      ghiNhan('bad');
      if (input) { input.style.borderColor = 'var(--danger)'; }
    }
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); checkBtn?.click(); }
  });

  input?.addEventListener('input', () => {
    const value = input.value.trim();
    const a2 = getAnswer();
    if (a2?.status) {
      setAnswer({ status: null, value });
      capNhatFb(null);
      input.style.borderColor = '';
    } else {
      setAnswer({ value });
    }
    ctx.onAnswer?.(q, 'none');
  });

  card.querySelectorAll('[data-self]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const status = btn.dataset.self;
      card.querySelectorAll('[data-self]').forEach((b) => {
        b.classList.remove('sel-ok', 'sel-bad', 'sel-unsure');
      });
      btn.classList.add(status === 'ok' ? 'sel-ok' : status === 'bad' ? 'sel-bad' : 'sel-unsure');
      ghiNhan(status);
    });
  });

  flagBtn?.addEventListener('click', () => {
    const bat = !flagBtn.classList.contains('on');
    flagBtn.classList.toggle('on', bat);
    flagBtn.setAttribute('aria-pressed', String(bat));
    setFlag(bat);
    toast(bat ? 'Đã đánh dấu câu này.' : 'Đã bỏ đánh dấu.');
  });

  hintBtn?.addEventListener('click', () => {
    if (soGoiY >= hints.length) return;
    const div = document.createElement('div');
    div.className = 'hint-item';
    div.innerHTML = `<b>Gợi ý ${soGoiY + 1}</b>${escapeHtml(hints[soGoiY])}`;
    hintZone.hidden = false;
    hintZone.appendChild(div);
    renderMath(div);
    soGoiY += 1;
    if (soGoiY >= hints.length) hintBtn.hidden = true;
    else hintBtn.textContent = `Gợi ý ${soGoiY + 1}/${hints.length}`;
  });

  solBtn?.addEventListener('click', () => {
    daHienLoiGiai = !daHienLoiGiai;
    if (solBox) solBox.hidden = !daHienLoiGiai;
    solBtn.textContent = daHienLoiGiai ? 'Ẩn lời giải' : 'Xem lời giải';
    if (daHienLoiGiai && solBox) {
      renderMath(solBox);
      solBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Đã làm đúng thì có thể xem nhanh đáp án số
  if (a?.status === 'ok' && q.loai === 'dapanso' && input) {
    input.style.borderColor = 'var(--ok)';
  }
  if (a?.status === 'bad' && input) {
    input.style.borderColor = 'var(--danger)';
  }

  renderMath(card);
  return card;
}

/** Dùng cho khu vực luyện nhanh: một câu, có nút chuyển câu. */
export function htmlTheCauDon(q, exam) {
  return `<div class="practice-session">${htmlTheCau(q, exam)}</div>`;
}
