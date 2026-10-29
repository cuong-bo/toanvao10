import { taiTatCaDe, taiDe, taiChuyenDe, ganThongTinDe } from '../data.js';
import { getSession, dsLoiSai, themLoiSai, xoaLoiSai } from '../store.js';
import { htmlTheCau, ganTheCau, thongTinLoi } from '../question.js';
import { kiemTraDapAn } from '../math.js';
import { emptyState, MUC_DO, nhanTrangThai, trangThaiCau, nhanNgan } from '../components.js';
import { escapeHtml, moHopThoai, rutGon } from '../utils.js';

function khoa(q) { return `${q.examId}::${q.id}`; }

function tron(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function layBoCau(query) {
  const topics = await taiChuyenDe().catch(() => []);
  const topicMap = new Map(topics.map((t) => [t.ma, t]));
  const ganTen = (q) => {
    const t = topicMap.get(q.chuyenDe);
    return { ...q, _tenChuyenDe: t?.ten || q.chuyenDe, _tenNgan: t?.tenNgan || t?.ten || q.chuyenDe };
  };

  let list = [];
  let tieuDe = 'Luyện tập';
  let moTa = '';
  let nguon = '';

  if (query.ids) {
    const cap = query.ids.split(',').map((x) => {
      const [examId, ...rest] = x.split(':');
      return { examId, qid: rest.join(':') };
    }).filter((x) => x.examId && x.qid);
    const examIds = [...new Set(cap.map((x) => x.examId))];
    const exams = await Promise.all(examIds.map((id) => taiDe(id).catch(() => null)));
    const map = new Map(exams.filter(Boolean).map((e) => [e.id, e]));
    for (const c of cap) {
      const exam = map.get(c.examId);
      const q = exam?.cauHoi?.find((x) => x.id === c.qid);
      if (q) list.push(ganTen({ ...q, ...ganThongTinDe(exam).find((x) => x.id === c.qid) }));
    }
    tieuDe = 'Làm lại các câu đã chọn';
    moTa = `${list.length} câu từ sổ lỗi hoặc kết quả bài làm.`;
  } else if (query.de) {
    const exam = await taiDe(query.de);
    const all = ganThongTinDe(exam).map(ganTen);
    if (query.sai === '1') {
      const session = getSession(exam.id);
      list = all.filter((q) => ['bad', 'unsure'].includes(trangThaiCau(session, q.id)));
      tieuDe = 'Làm lại câu sai';
      moTa = `${exam.tinh} ${exam.nam} — ${list.length} câu cần xem lại.`;
      nguon = exam.id;
    } else {
      list = all;
      tieuDe = `Luyện đề ${exam.tinh} ${exam.nam}`;
      moTa = `${all.length} câu.`;
    }
  } else if (query.loi === '1') {
    const mistakes = dsLoiSai();
    if (mistakes.length) {
      const ids = [...new Set(mistakes.map((m) => m.examId))];
      const exams = await Promise.all(ids.map((id) => taiDe(id).catch(() => null)));
      const map = new Map(exams.filter(Boolean).map((e) => [e.id, e]));
      for (const m of mistakes) {
        const exam = map.get(m.examId);
        const q = exam?.cauHoi?.find((x) => x.id === m.qid);
        if (q) list.push(ganTen({ ...q, ...ganThongTinDe(exam).find((x) => x.id === m.qid) }));
      }
    }
    tieuDe = 'Luyện từ sổ lỗi';
    moTa = `${list.length} câu đã sai hoặc chưa chắc.`;
  } else if (query.cd) {
    const topic = topicMap.get(query.cd);
    const allExams = await taiTatCaDe();
    let all = allExams.flatMap((e) => ganThongTinDe(e).map(ganTen));
    all = all.filter((q) => q.chuyenDe === query.cd);
    const mucs = (query.muc || '').split(',').filter(Boolean).map(Number);
    if (mucs.length) all = all.filter((q) => mucs.includes(Number(q.mucDo)));
    const tong = all.length;
    list = tron(all).slice(0, query.tat === '1' ? tong : 20);
    tieuDe = topic?.ten || 'Luyện chuyên đề';
    moTa = mucs.length
      ? `${mucs.map((m) => MUC_DO[m]?.ten || m).join(', ')} · ${list.length}/${tong} câu (chọn ngẫu nhiên).`
      : `${list.length}/${tong} câu (chọn ngẫu nhiên).`;
  }

  return { list, tieuDe, moTa, nguon, topics };
}

export async function luyenTap({ query }) {
  const { list, tieuDe, moTa } = await layBoCau(query);
  if (!list.length) {
    return emptyState({
      icon: '🎯',
      title: 'Chưa có câu nào để luyện',
      text: 'Có thể em chưa làm sai câu nào, hoặc bộ lọc chưa có câu phù hợp.',
      action: '<a class="btn primary" href="#/chuyen-de">Chọn chuyên đề khác</a>',
    });
  }

  const answers = {};
  const flags = new Set();
  let current = 0;
  let daXong = false;

  const html = `
    <div id="practice-shell">
      <h1 class="sr-only">Luyện tập: ${escapeHtml(tieuDe)}</h1>
      <p class="small" style="margin-bottom:10px"><a href="#/chuyen-de">← Chuyên đề</a></p>
      <div class="practice-top">
        <div style="min-width:0">
          <b style="font-size:1.05rem">${escapeHtml(tieuDe)}</b>
          <div class="muted tiny">${escapeHtml(moTa)}</div>
        </div>
        <span class="chip" id="practice-count">1/${list.length}</span>
      </div>
      <div class="progressbar" style="margin-bottom:14px"><i id="practice-progress" style="width:0%"></i></div>
      <div id="practice-host"></div>
      <div class="bottom-controls no-print">
        <button class="btn" type="button" id="p-prev">← Trước</button>
        <button class="btn" type="button" id="p-next">Sau →</button>
        <button class="btn primary" type="button" id="p-finish">Kết thúc</button>
      </div>
      <p class="file-note no-print" style="text-align:center">Phiên luyện không bấm giờ. Câu sai tự động vào sổ lỗi.</p>
    </div>`;

  function dem() {
    return list.filter((q) => answers[khoa(q)] && (answers[khoa(q)].status || String(answers[khoa(q)].value || '').trim())).length;
  }

  function capNhatHeader() {
    const c = document.getElementById('practice-count');
    if (c) c.textContent = `${current + 1}/${list.length}`;
    const p = document.getElementById('practice-progress');
    if (p) p.style.width = `${Math.round((dem() / list.length) * 100)}%`;
  }

  function veCau(i) {
    if (daXong) return;
    current = Math.min(Math.max(i, 0), list.length - 1);
    const q = list[current];
    const host = document.getElementById('practice-host');
    host.innerHTML = htmlTheCau(q, null, { answer: answers[khoa(q)] || {}, flagged: flags.has(khoa(q)) });
    ganTheCau(host, q, null, {
      getAnswer: () => answers[khoa(q)] || {},
      setAnswer: (data) => {
        answers[khoa(q)] = { ...(answers[khoa(q)] || {}), ...data };
      },
      isFlagged: () => flags.has(khoa(q)),
      setFlag: (bat) => { if (bat) flags.add(khoa(q)); else flags.delete(khoa(q)); },
      onAnswer: () => capNhatHeader(),
      onMistake: () => themLoiSai(thongTinLoi(q, null)),
      onCorrect: () => xoaLoiSai(q.examId, q.id),
    });
    document.getElementById('p-prev').disabled = current === 0;
    document.getElementById('p-next').disabled = current === list.length - 1;
    capNhatHeader();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function veTongKet() {
    daXong = true;
    // Tự chấm các câu đã nhập nhưng chưa bấm "Kiểm tra"
    for (const q of list) {
      const k = khoa(q);
      const a = answers[k];
      if (!a || a.status) continue;
      const value = String(a.value || '').trim();
      if (!value || !['dapanso', 'tracnghiem'].includes(q.loai)) continue;
      const kq = kiemTraDapAn(value, q.dapAn || []);
      answers[k] = { ...a, status: kq.dung ? 'ok' : 'bad' };
      if (kq.dung) xoaLoiSai(q.examId, q.id);
      else themLoiSai(thongTinLoi(q, null));
    }
    const demSt = { ok: 0, bad: 0, unsure: 0, none: 0 };
    list.forEach((q) => {
      const st = answers[khoa(q)]?.status || 'none';
      demSt[st] = (demSt[st] || 0) + 1;
    });
    const dung = demSt.ok;
    const chuaLam = demSt.none;
    const cauSai = list.filter((q) => ['bad', 'unsure'].includes(answers[khoa(q)]?.status));
    const ids = cauSai.map((q) => `${encodeURIComponent(q.examId)}:${encodeURIComponent(q.id)}`).join(',');
    let nhanXet = 'Em đã hoàn thành lượt luyện. Làm lại các câu sai là cách tiến bộ nhanh nhất.';
    if (dung === list.length) nhanXet = 'Tuyệt vời, em đúng hết lượt này! Thử tăng mức độ khó hoặc chuyển chuyên đề khác.';
    else if (dung >= list.length * 0.7) nhanXet = 'Kết quả tốt. Em xem lại các câu sai rồi luyện thêm một lượt nữa để chắc hơn.';
    else if (dung < list.length * 0.4) nhanXet = 'Đừng nản — hãy mở lời giải từng câu sai, rồi làm lại. Nền tảng chắc sẽ giúp em tiến nhanh.';

    document.getElementById('practice-shell').innerHTML = `
      <p class="small" style="margin-bottom:10px"><a href="#/chuyen-de">← Chuyên đề</a></p>
      <section class="card score-hero">
        <div>
          <div class="eyebrow">Kết thúc lượt luyện</div>
          <div class="big-score">${dung}<small>/${list.length} câu đúng</small></div>
        </div>
        <div style="flex:1;min-width:220px">
          <p style="margin:0 0 6px;font-weight:650">${escapeHtml(nhanXet)}</p>
          <p class="score-note">Điểm chỉ tính các câu em đánh dấu “Đúng”. Câu tự luận do em tự chấm.</p>
        </div>
      </section>
      <div class="result-stats" style="margin-top:14px">
        <div class="result-stat ok"><b>${demSt.ok}</b><span>Đúng</span></div>
        <div class="result-stat bad"><b>${demSt.bad}</b><span>Sai</span></div>
        <div class="result-stat unsure"><b>${demSt.unsure}</b><span>Chưa chắc</span></div>
        <div class="result-stat"><b>${chuaLam}</b><span>Chưa làm</span></div>
      </div>
      <div class="card card-pad" style="margin-top:14px">
        <div class="btn-row">
          ${ids ? `<a class="btn primary" href="#/luyen?ids=${ids}">Làm lại ${cauSai.length} câu sai</a>` : ''}
          <a class="btn" href="#/so-loi">Mở sổ lỗi</a>
          <a class="btn ghost" href="#/chuyen-de">Chọn chuyên đề khác</a>
        </div>
      </div>
      <div class="card card-pad" style="margin-top:14px">
        <h2 style="font-size:1.05rem">Chi tiết</h2>
        <div class="result-list" style="margin-top:10px">
          ${list.map((q) => {
            const ns = nhanTrangThai(answers[khoa(q)]?.status || 'none');
            return `<a class="result-item" href="#/cau/${encodeURIComponent(q.examId)}/${encodeURIComponent(q.id)}">
              <span class="num">${escapeHtml(nhanNgan(q))}</span>
              <span class="txt">${escapeHtml(rutGon(q.deBai, 92))}</span>
              <span class="st ${ns.lop}">${ns.chu}</span>
            </a>`;
          }).join('')}
        </div>
      </div>`;
    window.scrollTo({ top: 0 });
  }

  async function ketThuc() {
    const chua = list.filter((q) => !answers[khoa(q)]?.status && !String(answers[khoa(q)]?.value || '').trim()).length;
    if (chua) {
      const ok = await moHopThoai({
        tieuDe: `Còn ${chua} câu chưa làm`,
        noiDung: 'Em vẫn kết thúc lượt luyện và xem kết quả?',
        dongY: 'Xem kết quả',
        huy: 'Làm tiếp',
      });
      if (!ok) return;
    }
    veTongKet();
  }

  return {
    html,
    mount() {
      veCau(0);
      document.getElementById('p-prev')?.addEventListener('click', () => veCau(current - 1));
      document.getElementById('p-next')?.addEventListener('click', () => veCau(current + 1));
      document.getElementById('p-finish')?.addEventListener('click', ketThuc);
    },
  };
}
