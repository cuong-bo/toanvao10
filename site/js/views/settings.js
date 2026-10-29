import { getState, getSettings, setSetting, xuatTienDo, nhapTienDo, xoaToanBo } from '../store.js';
import { taiFile, toast, moHopThoai } from '../utils.js';

function coLuTru() {
  try {
    const k = '__test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch { return false; }
}

export function caiDat() {
  const s = getSettings();
  const state = getState();
  const soPhien = Object.keys(state.sessions || {}).length;
  const soLoi = Object.keys(state.mistakes || {}).length;
  const soViec = Object.keys(state.checklist || {}).length;
  const luuDuoc = coLuTru();

  const html = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Tuỳ chỉnh</div>
        <h1>Cài đặt &amp; tiến độ</h1>
        <p class="lead">Mọi dữ liệu nằm trên máy em. Không gửi lên máy chủ, không cần tài khoản.</p>
      </div>
    </div>

    ${luuDuoc ? '' : `<div class="card card-pad" style="border-color:var(--danger);background:var(--danger-soft);margin-bottom:14px">
      <b>Trình duyệt đang chặn lưu trữ</b>
      <p class="small" style="margin:6px 0 0">Em vẫn làm bài được, nhưng tắt trang sẽ mất tiến độ. Hãy tắt chế độ riêng tư hoặc cho phép lưu dữ liệu trang này.</p>
    </div>`}

    <div class="split two-col">
      <div>
        <div class="card card-pad">
          <h2 style="font-size:1.05rem">Giao diện</h2>
          <div class="setting-row">
            <div class="grow"><b>Chế độ màu</b><span>Tự động theo cài đặt điện thoại, hoặc chọn sáng/tối.</span></div>
            <div class="seg" id="seg-theme">
              <button type="button" data-theme-opt="auto" class="${s.theme === 'auto' ? 'on' : ''}">Tự động</button>
              <button type="button" data-theme-opt="light" class="${s.theme === 'light' ? 'on' : ''}">Sáng</button>
              <button type="button" data-theme-opt="dark" class="${s.theme === 'dark' ? 'on' : ''}">Tối</button>
            </div>
          </div>
          <div class="setting-row">
            <div class="grow"><b>Cỡ chữ</b><span>Chọn lớn hơn nếu em đọc trên màn hình nhỏ.</span></div>
            <div class="seg" id="seg-font">
              <button type="button" data-font="1" class="${Number(s.fontScale) === 1 ? 'on' : ''}">Chuẩn</button>
              <button type="button" data-font="1.12" class="${Number(s.fontScale) === 1.12 ? 'on' : ''}">Lớn</button>
              <button type="button" data-font="1.25" class="${Number(s.fontScale) === 1.25 ? 'on' : ''}">Rất lớn</button>
            </div>
          </div>
          <div class="setting-row">
            <div class="grow"><b>Mặc định bấm giờ</b><span>Khi mở đề mới, đồng hồ được bật sẵn.</span></div>
            <label class="switch"><input type="checkbox" id="chk-timer-default" ${s.timerDefault !== false ? 'checked' : ''} aria-label="Mặc định bật đồng hồ"><i></i></label>
          </div>
        </div>

        <div class="card card-pad" style="margin-top:14px">
          <h2 style="font-size:1.05rem">Dữ liệu trên máy</h2>
          <div class="result-stats" style="margin:10px 0 14px">
            <div class="result-stat"><b>${soPhien}</b><span>lượt làm bài</span></div>
            <div class="result-stat"><b>${soLoi}</b><span>câu trong sổ lỗi</span></div>
            <div class="result-stat"><b>${soViec}</b><span>việc đã đánh dấu</span></div>
          </div>
          <div class="btn-row">
            <button class="btn primary" type="button" id="btn-xuat">Xuất file tiến độ</button>
            <button class="btn" type="button" id="btn-nhap">Nhập file tiến độ</button>
            <input type="file" id="file-nhap" accept="application/json,.json" hidden>
          </div>
          <p class="file-note">Dùng khi đổi điện thoại hoặc muốn sao lưu. File chỉ chứa tiến độ, không chứa mật khẩu.</p>
          <div class="btn-row" style="margin-top:14px">
            <button class="btn danger small" type="button" id="btn-xoa-het">Xoá toàn bộ dữ liệu</button>
          </div>
        </div>
      </div>

      <div>
        <div class="card card-pad">
          <h2 style="font-size:1.05rem">Cài lên màn hình chính</h2>
          <p class="small muted">Mở nhanh như một ứng dụng, dùng được khi mất mạng.</p>
          <button class="btn primary wide" type="button" id="btn-install-2">Cài đặt ứng dụng</button>
          <p class="file-note">Trên Chrome: menu ⋮ → “Thêm vào màn hình chính”. Trên iPhone: nút Chia sẻ → “Thêm vào MH chính”.</p>
        </div>
        <div class="card card-pad" style="margin-top:14px">
          <h2 style="font-size:1.05rem">Về web này</h2>
          <p class="small muted">Trạm tiếp sức Toán vào 10 — web ôn thi miễn phí cho học sinh lớp 9 khu vực Tây Bắc. Đề thi ghi rõ nguồn; lời giải do nhóm biên soạn.</p>
          <div class="btn-row">
            <a class="btn small" href="#/gioi-thieu">Giới thiệu &amp; bản quyền</a>
          </div>
        </div>
        <div class="card card-pad" style="margin-top:14px;background:var(--surface-2);border-color:transparent">
          <b class="small">Phiên bản</b>
          <p class="small muted" style="margin:4px 0 0">2.0 · Dữ liệu cập nhật 29/10/2026</p>
        </div>
      </div>
    </div>`;

  return {
    html,
    mount() {
      document.querySelectorAll('[data-theme-opt]').forEach((b) => {
        b.addEventListener('click', () => {
          setSetting('theme', b.dataset.themeOpt);
          document.querySelectorAll('[data-theme-opt]').forEach((x) => x.classList.toggle('on', x === b));
          toast('Đã đổi chế độ màu.');
        });
      });
      document.querySelectorAll('[data-font]').forEach((b) => {
        b.addEventListener('click', () => {
          setSetting('fontScale', Number(b.dataset.font));
          document.querySelectorAll('[data-font]').forEach((x) => x.classList.toggle('on', x === b));
        });
      });
      document.getElementById('chk-timer-default')?.addEventListener('change', (e) => {
        setSetting('timerDefault', e.target.checked);
      });

      document.getElementById('btn-xuat')?.addEventListener('click', () => {
        const ngay = new Date().toISOString().slice(0, 10);
        taiFile(xuatTienDo(), `tien-do-on10-${ngay}.json`);
        toast('Đã xuất file tiến độ.');
      });

      const file = document.getElementById('file-nhap');
      document.getElementById('btn-nhap')?.addEventListener('click', () => file?.click());
      file?.addEventListener('change', async () => {
        const f = file.files?.[0];
        if (!f) return;
        try {
          const text = await f.text();
          nhapTienDo(text);
          toast('Đã nhập tiến độ. Đang tải lại…');
          setTimeout(() => location.reload(), 700);
        } catch (err) {
          toast(err.message || 'File không hợp lệ.');
        } finally {
          file.value = '';
        }
      });

      document.getElementById('btn-xoa-het')?.addEventListener('click', async () => {
        const ok = await moHopThoai({
          tieuDe: 'Xoá toàn bộ dữ liệu?',
          noiDung: 'Tất cả bài làm, sổ lỗi và checklist sẽ bị xoá khỏi máy này. Không thể hoàn tác.',
          dongY: 'Xoá hết',
          nguyHiem: true,
        });
        if (!ok) return;
        xoaToanBo();
        toast('Đã xoá dữ liệu.');
        setTimeout(() => location.reload(), 600);
      });

      document.getElementById('btn-install-2')?.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('on10:install'));
      });
    },
  };
}
