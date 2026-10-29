import { dangKy, batDau } from './router.js';
import { getSettings, setSetting } from './store.js';
import { toast } from './utils.js';

import { trangChu } from './views/home.js';
import { danhSachDe } from './views/exams.js';
import { gioiThieuDe } from './views/exam.js';
import { lamBai } from './views/take.js';
import { ketQua } from './views/result.js';
import { inDe } from './views/print.js';
import { danhSachChuyenDe, chiTietChuyenDe } from './views/topics.js';
import { luyenTap } from './views/practice.js';
import { xemCau } from './views/single.js';
import { soLoi } from './views/mistakes.js';
import { congThuc } from './views/formulas.js';
import { loTrinh } from './views/roadmap.js';
import { kiemTraDauVao } from './views/entry.js';
import { caiDat } from './views/settings.js';
import { gioiThieu } from './views/about.js';

/* ---------------- Giao diện ---------------- */

function apDungGiaoDien() {
  const s = getSettings();
  const toi = s.theme === 'dark' || (s.theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = toi ? 'dark' : 'light';
  document.documentElement.style.setProperty('--font-scale', String(s.fontScale || 1));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', toi ? '#0d1512' : '#0f3d2e');
}

function doiCheDoSangToi() {
  const dangToi = document.documentElement.dataset.theme === 'dark';
  setSetting('theme', dangToi ? 'light' : 'dark');
  apDungGiaoDien();
  toast(dangToi ? 'Đã chuyển sang chế độ sáng.' : 'Đã chuyển sang chế độ tối.');
}

function dongBoNutCaiDat() {
  const s = getSettings();
  document.querySelectorAll('[data-theme-opt]').forEach((b) => {
    b.classList.toggle('on', b.dataset.themeOpt === s.theme);
  });
  document.querySelectorAll('[data-font]').forEach((b) => {
    b.classList.toggle('on', Number(b.dataset.font) === Number(s.fontScale));
  });
  const chk = document.getElementById('chk-timer-default');
  if (chk) chk.checked = s.timerDefault !== false;
}

window.addEventListener('on10:settings', () => {
  apDungGiaoDien();
  dongBoNutCaiDat();
});
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (getSettings().theme === 'auto') apDungGiaoDien();
});

/* ---------------- Cài ứng dụng ---------------- */

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
});
window.addEventListener('appinstalled', () => toast('Đã cài ứng dụng lên màn hình chính.'));

async function moiCaiDat() {
  if (installPrompt) {
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch { /* bỏ qua */ }
    installPrompt = null;
    return;
  }
  toast('Trên Chrome: menu ⋮ → “Thêm vào màn hình chính”. Trên iPhone: Chia sẻ → “Thêm vào MH chính”.');
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#btn-install, #btn-install-2')) moiCaiDat();
});
window.addEventListener('on10:install', moiCaiDat);

/* ---------------- Định tuyến ---------------- */

dangKy('/', trangChu);
dangKy('/de', danhSachDe);
dangKy('/de/:id', gioiThieuDe);
dangKy('/lam/:id', lamBai);
dangKy('/ket-qua/:id', ketQua);
dangKy('/in/:id', inDe);
dangKy('/chuyen-de', danhSachChuyenDe);
dangKy('/chuyen-de/:ma', chiTietChuyenDe);
dangKy('/luyen', luyenTap);
dangKy('/cau/:examId/:qid', xemCau);
dangKy('/so-loi', soLoi);
dangKy('/cong-thuc', congThuc);
dangKy('/lo-trinh', loTrinh);
dangKy('/kiem-tra', kiemTraDauVao);
dangKy('/cai-dat', caiDat);
dangKy('/gioi-thieu', gioiThieu);

/* ---------------- Khởi động ---------------- */

apDungGiaoDien();
document.getElementById('btn-theme')?.addEventListener('click', doiCheDoSangToi);

window.addEventListener('online', () => toast('Đã có mạng trở lại.'));
window.addEventListener('offline', () => toast('Đang offline — web vẫn dùng được nếu đã cài.'));

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const moi = reg.installing;
        moi?.addEventListener('statechange', () => {
          if (moi.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Đã có bản cập nhật. Tải lại trang để dùng bản mới.');
          }
        });
      });
    }).catch((err) => console.warn('Service worker không đăng ký được:', err));
  });
}

batDau();
