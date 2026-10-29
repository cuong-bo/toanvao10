// Lưu tiến độ trên máy học sinh (localStorage), có dự phòng bộ nhớ.

const KEY = 'on10tb.progress.v2';
const MAX_DAYS = 400;

let memory = null;

function nowISO() { return new Date().toISOString(); }

function ngayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function macDinh() {
  return {
    version: 2,
    settings: { theme: 'auto', fontScale: 1, timerDefault: true },
    sessions: {},
    mistakes: {},
    checklist: {},
    activity: {},
    entryTest: null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

function doc() {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { memory = macDinh(); return memory; }
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
    memory = {
      ...macDinh(),
      ...parsed,
      settings: { ...macDinh().settings, ...(parsed.settings || {}) },
      sessions: parsed.sessions || {},
      mistakes: parsed.mistakes || {},
      checklist: parsed.checklist || {},
      activity: parsed.activity || {},
    };
    return memory;
  } catch (err) {
    console.warn('Không đọc được tiến độ, dùng bộ nhớ tạm:', err);
    memory = macDinh();
    return memory;
  }
}

function ghi() {
  const state = doc();
  state.updatedAt = nowISO();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Không lưu được vào localStorage:', err);
    return false;
  }
}

export function getState() { return doc(); }

export function getSettings() { return { ...doc().settings }; }

export function setSetting(key, value) {
  const state = doc();
  state.settings[key] = value;
  ghi();
  window.dispatchEvent(new CustomEvent('on10:settings', { detail: { key, value } }));
  return state.settings;
}

export function danhDauHoatDong() {
  const state = doc();
  const k = ngayKey();
  state.activity[k] = (state.activity[k] || 0) + 1;
  // giữ tối đa 400 ngày
  const keys = Object.keys(state.activity).sort();
  while (keys.length > MAX_DAYS) delete state.activity[keys.shift()];
  ghi();
}

/* ---------------- Phiên làm bài ---------------- */

export function getSession(examId) {
  return doc().sessions[examId] || null;
}

export function taoPhien(examId, { timer = false, minutes = 90, reset = false } = {}) {
  const state = doc();
  if (state.sessions[examId] && !reset) return state.sessions[examId];
  const session = {
    examId,
    startedAt: nowISO(),
    updatedAt: nowISO(),
    timer,
    remaining: Math.round(minutes * 60),
    answers: {},
    flags: [],
    current: 0,
    completedAt: null,
    score: null,
    elapsed: 0,
  };
  state.sessions[examId] = session;
  ghi();
  return session;
}

export function capNhatPhien(examId, patch = {}) {
  const state = doc();
  const s = state.sessions[examId];
  if (!s) return null;
  Object.assign(s, patch, { updatedAt: nowISO() });
  ghi();
  return s;
}

export function ghiDapAn(examId, qid, data = {}) {
  const state = doc();
  const s = state.sessions[examId];
  if (!s) return null;
  const cu = s.answers[qid] || {};
  s.answers[qid] = { ...cu, ...data, at: nowISO() };
  s.updatedAt = nowISO();
  danhDauHoatDong();
  ghi();
  window.dispatchEvent(new CustomEvent('on10:answer', { detail: { examId, qid, data: s.answers[qid] } }));
  return s.answers[qid];
}

export function datCo(examId, qid, bat) {
  const s = doc().sessions[examId];
  if (!s) return null;
  const set = new Set(s.flags || []);
  if (bat) set.add(qid); else set.delete(qid);
  s.flags = [...set];
  ghi();
  return s.flags;
}

export function xoaPhien(examId) {
  const state = doc();
  delete state.sessions[examId];
  ghi();
}

export function phienGanNhat() {
  const list = Object.values(doc().sessions)
    .filter((s) => !s.completedAt && Object.keys(s.answers || {}).length >= 0)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return list[0] || null;
}

/** Các đề đã hoàn thành, mới nhất trước. */
export function deDaHoanThanh() {
  return Object.values(doc().sessions)
    .filter((s) => s.completedAt)
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
}

export function thongKe() {
  const state = doc();
  const done = deDaHoanThanh();
  const totalSeconds = Object.values(state.sessions).reduce((sum, s) => sum + (Number(s.elapsed) || 0), 0);
  const ngayHoatDong = Object.keys(state.activity).sort();
  let streak = 0;
  if (ngayHoatDong.length) {
    const homNay = new Date();
    const homQua = new Date(Date.now() - 86400000);
    let moc = ngayHoatDong.includes(ngayKey(homNay)) ? homNay : (ngayHoatDong.includes(ngayKey(homQua)) ? homQua : null);
    if (moc) {
      let d = new Date(moc);
      while (ngayHoatDong.includes(ngayKey(d))) {
        streak += 1;
        d = new Date(d.getTime() - 86400000);
      }
    }
  }
  return {
    soDeXong: done.length,
    soPhut: Math.round(totalSeconds / 60),
    chuoiNgay: streak,
    soCauDaLam: Object.values(state.sessions).reduce((n, s) => n + Object.keys(s.answers || {}).length, 0),
  };
}

/* ---------------- Sổ lỗi sai ---------------- */

export const mistakeKey = (examId, qid) => `${examId}::${qid}`;

export function themLoiSai(entry) {
  if (!entry?.examId || !entry?.qid) return;
  const state = doc();
  const k = mistakeKey(entry.examId, entry.qid);
  const cu = state.mistakes[k];
  state.mistakes[k] = {
    ...cu,
    ...entry,
    count: (cu?.count || 0) + 1,
    lastAt: nowISO(),
  };
  ghi();
}

export function xoaLoiSai(examId, qid) {
  const state = doc();
  delete state.mistakes[mistakeKey(examId, qid)];
  ghi();
}

export function dsLoiSai() {
  return Object.values(doc().mistakes)
    .sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt)));
}

/* ---------------- Checklist lộ trình ---------------- */

export function docChecklist() { return { ...doc().checklist }; }

export function batTatChecklist(key) {
  const state = doc();
  if (state.checklist[key]) delete state.checklist[key];
  else state.checklist[key] = true;
  ghi();
  return Boolean(state.checklist[key]);
}

/* ---------------- Bài kiểm tra đầu vào ---------------- */

export function luuKetQuaDauVao(data) {
  const state = doc();
  state.entryTest = { ...data, at: nowISO() };
  ghi();
}

export function docKetQuaDauVao() { return doc().entryTest; }

/* ---------------- Xuất / nhập ---------------- */

export function xuatTienDo() {
  const state = doc();
  return JSON.stringify({ ...state, exportedAt: nowISO(), app: 'on10tb' }, null, 2);
}

export function nhapTienDo(json) {
  let data;
  try { data = JSON.parse(String(json).replace(/^\uFEFF/, '')); } catch { throw new Error('File không phải JSON hợp lệ.'); }
  if (!data || typeof data !== 'object' || !data.sessions || typeof data.sessions !== 'object') {
    throw new Error('File tiến độ không đúng định dạng.');
  }
  const state = macDinh();
  state.settings = { ...state.settings, ...(data.settings || {}) };
  state.sessions = data.sessions;
  state.mistakes = data.mistakes || {};
  state.checklist = data.checklist || {};
  state.activity = data.activity || {};
  state.entryTest = data.entryTest || null;
  state.createdAt = data.createdAt || state.createdAt;
  memory = state;
  ghi();
}

export function xoaToanBo() {
  try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ }
  memory = macDinh();
}
