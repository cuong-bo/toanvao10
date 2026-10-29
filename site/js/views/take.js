import { taiDe, taiChuyenDe } from '../data.js';
import { htmlTheCau, ganTheCau, thongTinLoi } from '../question.js';
import {
  getSession, taoPhien, capNhatPhien, getSettings,
  ghiDapAn, themLoiSai, xoaLoiSai,
} from '../store.js';
import { kiemTraDapAn } from '../math.js';
import { escapeHtml, toast, moHopThoai, dinhDangThoiGian } from '../utils.js';
import { soCauDaLam, daTraLoi, nhanCau, nhanNgan } from '../components.js';

export async function lamBai({ params, query }) {
  const [exam, topics] = await Promise.all([taiDe(params.id), taiChuyenDe().catch(() => [])]);
  const topicMap = new Map(topics.map((t) => [t.ma, t]));
  for (const q of exam.cauHoi || []) {
    const t = topicMap.get(q.chuyenDe);
    q._tenChuyenDe = t?.ten || q.chuyenDe;
    q._tenNgan = t?.tenNgan || q._tenChuyenDe;
  }
  const examId = exam.id;
  const cauHoi = exam.cauHoi || [];
  if (!cauHoi.length) throw new Error('Đề này chưa có câu hỏi.');

  const moi = query.moi === '1';
  let session = getSession(examId);
  if (moi) {
    session = taoPhien(examId, {
      timer: query.hct === '1' || (query.hct !== '0' && getSettings().timerDefault !== false),
      minutes: exam.thoiGian || 90,
      reset: true,
    });
    history.replaceState(null, '', `#/lam/${encodeURIComponent(examId)}`);
  } else if (!session) {
    session = taoPhien(examId, {
      timer: query.hct === '1' || (query.hct !== '0' && getSettings().timerDefault !== false),
      minutes: exam.thoiGian || 90,
    });
    history.replaceState(null, '', `#/lam/${encodeURIComponent(examId)}`);
  } else if (session.completedAt) {
    location.replace(`#/ket-qua/${encodeURIComponent(examId)}`);
    return '';
  }

  let current = Math.min(Math.max(Number(session.current) || 0, 0), cauHoi.length - 1);
  let remaining = Number.isFinite(session.remaining) ? session.remaining : (exam.thoiGian || 90) * 60;
  let elapsed = Number(session.elapsed) || 0;
  let daNop = false;
  let lastTick = Date.now();
  let saveCounter = 0;
  let timerId = null;

  const tongDiem = cauHoi.reduce((s, q) => s + (Number(q.diem) || 0), 0);

  const html = `
    <div class="take-top">
      <div class="take-top-inner">
        <a class="icon-btn" href="#/de/${encodeURIComponent(examId)}" aria-label="Thoát bài làm" title="Thoát">←</a>
        <div class="take-title">
          <b>${escapeHtml(exam.tieuDe || 'Làm bài')}</b>
          <span id="take-sub">${escapeHtml(exam.tinh || '')} ${exam.nam || ''}</span>
        </div>
        <div class="timer ${session.timer ? '' : 'off'}" id="take-timer" aria-live="off">${session.timer ? dinhDangThoiGian(remaining) : 'Không bấm giờ'}</div>
      </div>
      <div class="progressbar"><i id="take-progress"></i></div>
    </div>

    <div id="q-host"></div>

    <div class="bottom-controls no-print">
      <button class="btn" type="button" id="btn-prev">← Trước</button>
      <button class="btn" type="button" id="btn-next">Sau →</button>
      <button class="btn primary" type="button" id="btn-submit">Nộp bài</button>
    </div>

    <details class="qnav card no-print" id="qnav">
      <summary><span id="qnav-summary">Danh sách câu</span></summary>
      <div class="answer-grid" id="answer-grid">
        ${cauHoi.map((q, i) => `<button class="ag-btn" type="button" data-jump="${i}" aria-label="Đến ${nhanCau(q)}">${nhanNgan(q)}</button>`).join('')}
      </div>
      <div class="qnav-legend">
        <span><i style="background:var(--ok-soft)"></i>Đúng</span>
        <span><i style="background:var(--danger-soft)"></i>Sai</span>
        <span><i style="background:var(--warn-soft)"></i>Chưa chắc</span>
        <span><i style="background:var(--accent)"></i>Đã nhập đáp án</span>
      </div>
    </details>`;

  function capNhatTienDo() {
    const s = getSession(examId);
    const daLam = soCauDaLam(s);
    const pct = Math.round((daLam / cauHoi.length) * 100);
    const bar = document.getElementById('take-progress');
    if (bar) bar.style.width = `${pct}%`;
    const sub = document.getElementById('take-sub');
    if (sub) sub.textContent = `${exam.tinh || ''} ${exam.nam || ''} · ${daLam}/${cauHoi.length} câu`;
    const sum = document.getElementById('qnav-summary');
    if (sum) sum.textContent = `Danh sách câu (${daLam}/${cauHoi.length} đã làm)`;
  }

  function capNhatLuoi() {
    const s = getSession(examId);
    document.querySelectorAll('#answer-grid [data-jump]').forEach((btn) => {
      const q = cauHoi[Number(btn.dataset.jump)];
      const a = s?.answers?.[q.id];
      btn.className = 'ag-btn';
      const st = a?.status;
      if (st === 'ok') btn.classList.add('ok');
      else if (st === 'bad') btn.classList.add('bad');
      else if (st === 'unsure') btn.classList.add('unsure');
      else if (daTraLoi(a)) btn.classList.add('answered');
      if (Number(btn.dataset.jump) === current) btn.classList.add('current');
      if ((s?.flags || []).includes(q.id)) btn.classList.add('flagged');
    });
  }

  function veCau(index) {
    current = Math.min(Math.max(index, 0), cauHoi.length - 1);
    const sessionNow = getSession(examId);
    capNhatPhien(examId, { current });
    const q = cauHoi[current];
    const host = document.getElementById('q-host');
    host.innerHTML = htmlTheCau(q, exam, {
      answer: sessionNow?.answers?.[q.id],
      flagged: (sessionNow?.flags || []).includes(q.id),
    });
    ganTheCau(host, q, exam, {
      onAnswer: () => { capNhatLuoi(); capNhatTienDo(); },
    });
    capNhatLuoi();
    capNhatTienDo();
    document.getElementById('btn-prev').disabled = current === 0;
    const next = document.getElementById('btn-next');
    next.textContent = current === cauHoi.length - 1 ? 'Câu cuối' : 'Sau →';
    next.disabled = current === cauHoi.length - 1;
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  }

  async function nopBai({ tuDong = false } = {}) {
    if (daNop) return;
    const s = getSession(examId);
    const chuaLam = cauHoi.filter((q) => !daTraLoi(s?.answers?.[q.id])).length;
    if (!tuDong && chuaLam > 0) {
      const ok = await moHopThoai({
        tieuDe: `Còn ${chuaLam} câu chưa làm`,
        noiDung: 'Em vẫn muốn nộp bài? Có thể quay lại làm tiếp sau nếu chưa nộp.',
        dongY: 'Vẫn nộp',
        huy: 'Làm tiếp',
      });
      if (!ok) return;
    }
    daNop = true;
    clearInterval(timerId);
    // Tự chấm các câu đã nhập nhưng chưa bấm "Kiểm tra"
    for (const q of cauHoi) {
      const a = getSession(examId)?.answers?.[q.id];
      if (!a || a.status) continue;
      const value = String(a.value || '').trim();
      if (!value) continue;
      if (q.loai === 'dapanso' || q.loai === 'tracnghiem') {
        const kq = kiemTraDapAn(value, q.dapAn || []);
        ghiDapAn(examId, q.id, { status: kq.dung ? 'ok' : 'bad', value });
        if (kq.dung) xoaLoiSai(examId, q.id);
        else themLoiSai(thongTinLoi(q, exam));
      }
    }
    const s2 = getSession(examId) || {};
    const score = cauHoi.reduce((sum, q) => {
      const st = s2.answers?.[q.id]?.status;
      return st === 'ok' ? sum + (Number(q.diem) || 0) : sum;
    }, 0);
    capNhatPhien(examId, {
      completedAt: new Date().toISOString(),
      score: Math.round(score * 100) / 100,
      tongDiem,
      elapsed: Math.round(elapsed),
      remaining: Math.round(remaining),
      hetGio: Boolean(tuDong),
    });
    if (tuDong) toast('Hết giờ — bài đã được nộp tự động.');
    location.replace(`#/ket-qua/${encodeURIComponent(examId)}`);
  }

  function capNhatDongHo() {
    const now = Date.now();
    const dt = Math.max(0, (now - lastTick) / 1000);
    lastTick = now;
    elapsed += dt;
    if (session.timer) {
      remaining = Math.max(0, remaining - dt);
      const el = document.getElementById('take-timer');
      if (el) {
        el.textContent = dinhDangThoiGian(remaining);
        el.classList.toggle('low', remaining <= 300);
      }
      if (remaining <= 0 && !daNop) {
        nopBai({ tuDong: true });
      }
    }
    saveCounter += dt;
    if (saveCounter >= 8) {
      saveCounter = 0;
      capNhatPhien(examId, { elapsed: Math.round(elapsed), remaining: Math.round(remaining) });
    }
  }

  return {
    html,
    mount() {
      veCau(current);
      timerId = setInterval(capNhatDongHo, 1000);
      lastTick = Date.now();

      document.getElementById('btn-prev')?.addEventListener('click', () => veCau(current - 1));
      document.getElementById('btn-next')?.addEventListener('click', () => veCau(current + 1));
      document.getElementById('btn-submit')?.addEventListener('click', () => nopBai({}));
      document.getElementById('answer-grid')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-jump]');
        if (!btn) return;
        veCau(Number(btn.dataset.jump));
        const nav = document.getElementById('qnav');
        if (nav) nav.open = false;
        window.scrollTo({ top: 0 });
      });

      const luuTienDo = () => {
        if (daNop) return;
        capNhatPhien(examId, { elapsed: Math.round(elapsed), remaining: Math.round(remaining), current });
      };
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') luuTienDo();
        else lastTick = Date.now();
      };
      const onHashChange = () => {
        if (location.hash.startsWith('#/lam/')) return;
        luuTienDo();
        clearInterval(timerId);
        window.removeEventListener('pagehide', luuTienDo);
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('hashchange', onHashChange);
      };
      window.addEventListener('pagehide', luuTienDo);
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('hashchange', onHashChange);
    },
  };
}
