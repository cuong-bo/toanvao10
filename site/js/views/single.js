import { taiDe, taiChuyenDe } from '../data.js';
import { getSession, themLoiSai, xoaLoiSai } from '../store.js';
import { htmlTheCau, ganTheCau, thongTinLoi } from '../question.js';
import { emptyState, nhanCau, chipMucDo } from '../components.js';
import { escapeHtml, chiaSe, toast } from '../utils.js';

export async function xemCau({ params }) {
  const [exam, topics] = await Promise.all([taiDe(params.examId), taiChuyenDe().catch(() => [])]);
  const q = (exam.cauHoi || []).find((x) => x.id === params.qid);
  if (!q) {
    return emptyState({
      icon: '❓', title: 'Không tìm thấy câu hỏi',
      text: 'Câu này có thể đã được thay đổi.',
      action: `<a class="btn primary" href="#/de/${encodeURIComponent(exam.id)}">Về đề</a>`,
    });
  }
  const topic = topics.find((t) => t.ma === q.chuyenDe);
  q._tenChuyenDe = topic?.ten || q.chuyenDe;
  q._tenNgan = topic?.tenNgan || q._tenChuyenDe;
  const session = getSession(exam.id);
  const answer = session?.answers?.[q.id] || {};
  const flags = new Set(session?.flags || []);
  const idx = exam.cauHoi.findIndex((x) => x.id === q.id);
  const next = exam.cauHoi[idx + 1];
  const prev = exam.cauHoi[idx - 1];
  const backHref = session?.completedAt ? `#/ket-qua/${encodeURIComponent(exam.id)}` : `#/de/${encodeURIComponent(exam.id)}`;
  const backLabel = session?.completedAt ? 'Kết quả bài làm' : exam.tieuDe;

  const html = `
    <h1 class="sr-only">${escapeHtml(nhanCau(q))} — ${escapeHtml(exam.tieuDe)}</h1>
    <p class="small" style="margin-bottom:12px">
      <a href="${backHref}">← ${escapeHtml(backLabel)}</a>
    </p>
    <div class="chip-row" style="margin-bottom:12px">
      <span class="chip brand">${escapeHtml(exam.tinh)} ${exam.nam}</span>
      <span class="chip">${escapeHtml(nhanCau(q))}</span>
      ${chipMucDo(q.mucDo)}
      ${session?.completedAt ? `<span class="chip ${answer.status === 'ok' ? 'ok' : answer.status === 'bad' ? 'danger' : ''}">Kết quả bài làm: ${answer.status === 'ok' ? 'đúng' : answer.status === 'bad' ? 'sai' : answer.status === 'unsure' ? 'chưa chắc' : 'chưa làm'}</span>` : ''}
    </div>
    <div id="single-host"></div>
    <div class="bottom-controls no-print">
      ${prev ? `<a class="btn" href="#/cau/${encodeURIComponent(exam.id)}/${encodeURIComponent(prev.id)}">← Câu trước</a>` : '<span></span>'}
      <button class="btn" type="button" id="btn-share-q">Chia sẻ câu này</button>
      ${next ? `<a class="btn primary" href="#/cau/${encodeURIComponent(exam.id)}/${encodeURIComponent(next.id)}">Câu sau →</a>` : `<a class="btn primary" href="#/de/${encodeURIComponent(exam.id)}">Về đề</a>`}
    </div>
    <p class="file-note" style="text-align:center">Em có thể nhập đáp án để tự kiểm tra. Kết quả ở đây không làm thay đổi bài đã nộp.</p>`;

  return {
    html,
    mount() {
      const host = document.getElementById('single-host');
      host.innerHTML = htmlTheCau(q, exam, { answer, flagged: flags.has(q.id) });
      ganTheCau(host, q, exam, {
        getAnswer: () => answer,
        setAnswer: (data) => { Object.assign(answer, data); },
        isFlagged: () => flags.has(q.id),
        setFlag: (bat) => { if (bat) flags.add(q.id); else flags.delete(q.id); },
        onMistake: () => themLoiSai(thongTinLoi(q, exam)),
        onCorrect: () => xoaLoiSai(exam.id, q.id),
      });
      document.getElementById('btn-share-q')?.addEventListener('click', async () => {
        const kq = await chiaSe({
          tieuDe: `${nhanCau(q)} — ${exam.tinh} ${exam.nam}`,
          noiDung: 'Cùng xem và làm câu này trên Trạm tiếp sức Toán vào 10',
          hash: `#/cau/${encodeURIComponent(exam.id)}/${encodeURIComponent(q.id)}`,
        });
        if (kq === 'copied') toast('Đã chép link câu hỏi.');
      });
    },
  };
}
