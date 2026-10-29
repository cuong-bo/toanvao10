import { taiKiemTraDauVao, taiChuyenDe } from '../data.js';
import { docKetQuaDauVao, luuKetQuaDauVao } from '../store.js';
import { htmlTheCau, ganTheCau } from '../question.js';
import { kiemTraDapAn } from '../math.js';
import { escapeHtml, toast, moHopThoai, dinhDangThoiGian, rutGon } from '../utils.js';
import { renderMath } from '../math.js';

export async function kiemTraDauVao({ query }) {
  const [data, topics] = await Promise.all([taiKiemTraDauVao(), taiChuyenDe().catch(() => [])]);
  const topicMap = new Map(topics.map((t) => [t.ma, t]));
  const cauHoi = (data.cauHoi || []).map((q) => {
    const t = topicMap.get(q.chuyenDe);
    return {
      ...q,
      _tenChuyenDe: t?.ten || q.chuyenDe,
      _tenNgan: t?.tenNgan || t?.ten || q.chuyenDe,
      diem: 1,
    };
  });
  const saved = docKetQuaDauVao();
  const batDau = query.lam === '1';

  if (!batDau && saved) {
    return ketQuaHtml(saved, cauHoi, topicMap);
  }

  if (!batDau) {
    return {
      html: `
        <div class="page-head">
          <div>
            <div class="eyebrow">15 phút · 10 câu</div>
            <h1>Kiểm tra trình độ</h1>
            <p class="lead">Làm nhanh để biết mình đang ở đâu. Không tính điểm thi, không áp lực — chỉ để chọn đúng chuyên đề ôn trước.</p>
          </div>
        </div>
        <div class="split two-col">
          <div class="card card-pad">
            <h2 style="font-size:1.1rem">Bài kiểm tra gồm gì?</h2>
            <ul class="formula-list">
              <li>10 câu trắc nghiệm đáp án số, phủ 7 chuyên đề.</li>
              <li>15 phút, có đồng hồ nhưng có thể nộp sớm.</li>
              <li>Cuối bài có gợi ý chuyên đề nên ôn trước.</li>
              <li>Không cần tài khoản, kết quả lưu trên máy em.</li>
            </ul>
            <p class="muted small">Nếu chưa quen, cứ làm theo cảm tính — đừng tra cứu, kết quả sẽ sát hơn.</p>
            <a class="btn primary wide" href="#/kiem-tra?lam=1" id="btn-start-entry">Bắt đầu 15 phút</a>
          </div>
          <div class="card card-pad" style="background:var(--accent-soft);border-color:transparent">
            <b>Em nên biết</b>
            <p class="small" style="margin:6px 0 10px">Mức độ câu hỏi: 4 nền tảng, 4 khá, 2 nâng cao. Đúng 0–3 câu: bắt đầu từ nền tảng. Đúng 4–6: mức khá. Từ 7 câu: tập trung câu khó.</p>
            ${saved ? `<p class="small" style="margin:0">Lần trước em được <b>${saved.score}/${saved.total}</b> — <a href="#/kiem-tra">xem lại kết quả</a>.</p>` : ''}
          </div>
        </div>`,
    };
  }

  // Làm bài
  const answers = {};
  let current = 0;
  let daNop = false;
  let remaining = (data.thoiGian || 15) * 60;
  let timerId = null;
  let lastTick = Date.now();

  const html = `
    <div id="entry-shell">
      <div class="practice-top">
        <div>
          <b style="font-size:1.05rem">Kiểm tra trình độ</b>
          <div class="muted tiny">10 câu · 15 phút · không xem tài liệu</div>
        </div>
        <div class="timer" id="entry-timer">${dinhDangThoiGian(remaining)}</div>
      </div>
      <div class="progressbar" style="margin-bottom:14px"><i id="entry-progress" style="width:0%"></i></div>
      <div id="entry-host"></div>
      <div class="bottom-controls no-print">
        <button class="btn" type="button" id="e-prev">← Trước</button>
        <button class="btn" type="button" id="e-next">Sau →</button>
        <button class="btn primary" type="button" id="e-submit">Nộp bài</button>
      </div>
      <p class="file-note" style="text-align:center">Hết giờ bài sẽ tự nộp. Đáp án và lời giải hiện sau khi nộp.</p>
    </div>`;

  function capNhat() {
    const daLam = cauHoi.filter((q) => String(answers[q.id]?.value || '').trim()).length;
    const bar = document.getElementById('entry-progress');
    if (bar) bar.style.width = `${Math.round((daLam / cauHoi.length) * 100)}%`;
    const prev = document.getElementById('e-prev');
    const next = document.getElementById('e-next');
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === cauHoi.length - 1;
  }

  function veCau(i) {
    if (daNop) return;
    current = Math.min(Math.max(i, 0), cauHoi.length - 1);
    const q = cauHoi[current];
    const host = document.getElementById('entry-host');
    host.innerHTML = htmlTheCau(q, null, { answer: answers[q.id] || {}, hideHelp: true });
    ganTheCau(host, q, null, {
      getAnswer: () => answers[q.id] || {},
      setAnswer: (d) => { answers[q.id] = { ...(answers[q.id] || {}), ...d }; },
      isFlagged: () => false,
      setFlag: () => {},
      onAnswer: capNhat,
      onMistake: () => {},
      onCorrect: () => {},
    });
    capNhat();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function tinhKetQua() {
    const chiTiet = cauHoi.map((q) => {
      const value = String(answers[q.id]?.value || '').trim();
      const dung = value ? kiemTraDapAn(value, q.dapAn || []).dung : false;
      return { q, value, dung };
    });
    const score = chiTiet.filter((x) => x.dung).length;
    const total = cauHoi.length;
    const level = score >= 7 ? 'Nâng cao' : score >= 4 ? 'Khá' : 'Nền tảng';
    const saiTopic = new Map();
    for (const x of chiTiet) {
      if (!x.dung) saiTopic.set(x.q.chuyenDe, (saiTopic.get(x.q.chuyenDe) || 0) + 1);
    }
    const recommend = [...saiTopic.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([ma]) => ma);
    if (!recommend.length) recommend.push('bdt', 'viet');
    return { score, total, level, recommend, chiTiet };
  }

  async function ketThuc(tuDong = false) {
    if (daNop) return;
    if (!tuDong) {
      const chua = cauHoi.filter((q) => !String(answers[q.id]?.value || '').trim()).length;
      if (chua) {
        const ok = await moHopThoai({
          tieuDe: `Còn ${chua} câu chưa làm`,
          noiDung: 'Em vẫn nộp bài kiểm tra?',
          dongY: 'Nộp bài',
          huy: 'Làm tiếp',
        });
        if (!ok) return;
      }
    }
    daNop = true;
    clearInterval(timerId);
    luuVaHienThi();
  }

  function luuVaHienThi() {
    const kq = tinhKetQua();
    const payload = {
      score: kq.score,
      total: kq.total,
      level: kq.level,
      recommend: kq.recommend,
      answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.value || ''])),
      chiTiet: kq.chiTiet.map((x) => ({ qid: x.q.id, value: x.value, dung: x.dung })),
    };
    luuKetQuaDauVao(payload);
    history.replaceState(null, '', '#/kiem-tra');
    const shell = document.getElementById('entry-shell');
    if (!shell) return;
    shell.innerHTML = ketQuaNoiDung(payload, cauHoi, topicMap);
    renderMath(shell);
    window.scrollTo({ top: 0 });
    if (tuDongFlag) toast('Hết giờ — bài kiểm tra đã được nộp.');
  }
  let tuDongFlag = false;

  function tick() {
    if (daNop) return;
    const now = Date.now();
    if (now - lastTick >= 1000) {
      const dt = (now - lastTick) / 1000;
      remaining = Math.max(0, remaining - dt);
      lastTick = now;
      const el = document.getElementById('entry-timer');
      if (el) {
        el.textContent = dinhDangThoiGian(remaining);
        el.classList.toggle('low', remaining <= 120);
      }
      if (remaining <= 0) {
        tuDongFlag = true;
        ketThuc(true);
      }
    }
  }

  return {
    html,
    mount() {
      veCau(0);
      timerId = setInterval(tick, 500);
      lastTick = Date.now();
      document.getElementById('e-prev')?.addEventListener('click', () => veCau(current - 1));
      document.getElementById('e-next')?.addEventListener('click', () => veCau(current + 1));
      document.getElementById('e-submit')?.addEventListener('click', () => ketThuc(false));
      window.addEventListener('hashchange', () => clearInterval(timerId), { once: true });
    },
  };
}

function ketQuaHtml(saved, cauHoi, topicMap) {
  return {
    html: `<div id="entry-result">${ketQuaNoiDung(saved, cauHoi, topicMap)}</div>`,
    mount() {
      renderMath(document.getElementById('entry-result'));
    },
  };
}

function ketQuaNoiDung(saved, cauHoi, topicMap) {
  const score = saved.score ?? 0;
  const total = saved.total ?? cauHoi.length;
  const pct = Math.round((score / (total || 1)) * 100);
  let nhanXet = 'Em nên bắt đầu từ các câu Nền tảng, làm chắc rồi mới tăng mức.';
  if (pct >= 70) nhanXet = 'Nền tảng của em khá tốt. Hãy dành thời gian cho câu Khá và Nâng cao để lấy điểm 9–10.';
  else if (pct >= 40) nhanXet = 'Em đã nắm được phần cơ bản. Cần luyện thêm để ổn định điểm 7–8 trước khi học câu khó.';
  const recommend = (saved.recommend || []).map((ma) => topicMap.get(ma)).filter(Boolean);
  const chiTiet = saved.chiTiet || [];
  const dungMap = new Map(chiTiet.map((x) => [x.qid, x]));

  return `
    <div class="page-head">
      <div>
        <div class="eyebrow">Kết quả kiểm tra</div>
        <h1>Trình độ hiện tại: ${escapeHtml(saved.level || '')}</h1>
      </div>
    </div>
    <section class="card score-hero">
      <div>
        <div class="big-score">${score}<small>/${total} câu</small></div>
      </div>
      <div style="flex:1;min-width:220px">
        <div class="chip-row" style="margin-bottom:8px"><span class="chip brand">${escapeHtml(saved.level || '')}</span><span class="chip">${pct}%</span></div>
        <p style="margin:0;font-weight:650">${escapeHtml(nhanXet)}</p>
      </div>
    </section>

    <div class="split two-col" style="margin-top:16px">
      <div class="card card-pad">
        <h2 style="font-size:1.05rem">Chuyên đề nên ôn trước</h2>
        <p class="muted small">Dựa trên các câu em làm chưa đúng.</p>
        <div class="grid" style="gap:9px">
          ${recommend.length
            ? recommend.map((t) => `<a class="card level-card card-hover" href="#/chuyen-de/${encodeURIComponent(t.ma)}" style="text-decoration:none">
                <span class="dot" style="background:${t.mau}"></span>
                <div class="grow"><b>${escapeHtml(t.ten)}</b><span>${escapeHtml(t.tenNgan)} · 3 mức độ</span></div>
                <span class="muted">›</span>
              </a>`).join('')
            : '<p class="muted">Em đã làm tốt tất cả chuyên đề. Thử sức với đề thi thật nhé.</p>'}
        </div>
        <div class="btn-row" style="margin-top:14px">
          <a class="btn primary" href="#/de">Làm đề thi</a>
          <a class="btn" href="#/kiem-tra?lam=1">Làm lại bài kiểm tra</a>
        </div>
      </div>
      <div class="card card-pad">
        <h2 style="font-size:1.05rem">Chi tiết</h2>
        <div class="result-list" style="margin-top:10px">
          ${cauHoi.map((q) => {
            const x = dungMap.get(q.id);
            const ns = x?.dung ? { chu: 'Đúng', lop: 'ok' } : { chu: x?.value ? 'Sai' : 'Chưa làm', lop: x?.value ? 'bad' : 'none' };
            return `<div class="result-item" style="align-items:flex-start">
              <span class="num">${q.soCau}</span>
              <span class="txt" style="white-space:normal">${escapeHtml(rutGon(q.deBai, 78))}</span>
              <span class="st ${ns.lop}">${ns.chu}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="card card-pad" style="margin-top:16px">
      <h2 style="font-size:1.05rem">Xem lời giải các câu</h2>
      <div style="display:grid;gap:8px;margin-top:10px">
        ${cauHoi.map((q) => {
          const x = dungMap.get(q.id);
          return `<details class="card" style="padding:10px 14px">
            <summary style="cursor:pointer;font-weight:650;font-size:.9rem">Câu ${q.soCau} — ${x?.dung ? 'đúng' : x?.value ? 'sai' : 'chưa làm'} ${x?.value ? `(em nhập: ${escapeHtml(x.value)})` : ''}</summary>
            <div class="qbody" style="margin-top:8px">${escapeHtml(q.deBai.replace(/<[^>]+>/g, ' '))}</div>
            <div class="solution" style="margin-top:8px">
              <ol>${(q.loiGiai || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ol>
              ${q.dapAn?.length ? `<div class="dapan"><b>Đáp án:</b> ${escapeHtml(q.dapAn.join('; '))}</div>` : ''}
            </div>
          </details>`;
        }).join('')}
      </div>
    </div>`;
}
