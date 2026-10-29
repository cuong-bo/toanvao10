import { taiCatalog } from '../data.js';
import { examCard, emptyState, thanhPhanTram, soCauDaLam } from '../components.js';
import { getState } from '../store.js';
import { escapeHtml, chuanHoa, $ } from '../utils.js';

export async function danhSachDe({ query }) {
  const catalog = await taiCatalog();
  const state = getState();
  const tinhList = [...new Set(catalog.map((d) => d.tinh).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
  const namList = [...new Set(catalog.map((d) => d.nam).filter(Boolean))].sort((a, b) => b - a);

  const giaTri = {
    q: query.q || '',
    tinh: query.tinh || '',
    nam: query.nam || '',
  };

  const html = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Thư viện đề</div>
        <h1>Đề thi vào lớp 10</h1>
        <p class="lead">Đề chính thức của các tỉnh Tây Bắc và lân cận, kèm lời giải tự soạn. Lọc theo tỉnh, năm hoặc tìm nhanh.</p>
      </div>
    </div>

    <div class="filters">
      <div class="field">
        <label for="f-q">Tìm kiếm</label>
        <div class="searchbox"><input class="input" id="f-q" type="search" placeholder="Tỉnh, năm, từ khoá…" value="${escapeHtml(giaTri.q)}" autocomplete="off"></div>
      </div>
      <div class="field">
        <label for="f-tinh">Tỉnh / thành</label>
        <select class="select" id="f-tinh">
          <option value="">Tất cả tỉnh</option>
          ${tinhList.map((t) => `<option value="${escapeHtml(t)}" ${t === giaTri.tinh ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="f-nam">Năm</label>
        <select class="select" id="f-nam">
          <option value="">Tất cả năm</option>
          ${namList.map((n) => `<option value="${n}" ${String(n) === String(giaTri.nam) ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </div>
    </div>

    <p class="count-line" id="ket-qua-dem"></p>
    <div id="ds-de"></div>`;

  function loc() {
    const q = chuanHoa(giaTri.q);
    return catalog.filter((d) => {
      if (giaTri.tinh && d.tinh !== giaTri.tinh) return false;
      if (giaTri.nam && String(d.nam) !== String(giaTri.nam)) return false;
      if (!q) return true;
      const kho = chuanHoa([d.tieuDe, d.tinh, d.nam, ...(d.tags || [])].join(' '));
      return q.split(' ').every((tu) => kho.includes(tu));
    }).sort((a, b) => (b.nam - a.nam) || String(a.tinh).localeCompare(String(b.tinh), 'vi'));
  }

  function ve() {
    const ds = loc();
    $('#ket-qua-dem').textContent = ds.length
      ? `Tìm thấy ${ds.length} đề${giaTri.tinh ? ` của ${giaTri.tinh}` : ''}${giaTri.nam ? ` năm ${giaTri.nam}` : ''}.`
      : 'Không tìm thấy đề phù hợp.';
    const box = $('#ds-de');
    if (!ds.length) {
      box.innerHTML = emptyState({
        icon: '🔍',
        title: 'Không có đề phù hợp',
        text: 'Em thử bỏ bớt bộ lọc hoặc tìm bằng từ khoá khác nhé.',
        action: '<button class="btn" type="button" id="xoa-loc">Xoá bộ lọc</button>',
      });
      $('#xoa-loc')?.addEventListener('click', () => {
        giaTri.q = ''; giaTri.tinh = ''; giaTri.nam = '';
        $('#f-q').value = ''; $('#f-tinh').value = ''; $('#f-nam').value = '';
        capNhatUrl(); ve();
      });
      return;
    }
    box.innerHTML = `<div class="card exam-list">${ds.map((d) => {
      const s = state.sessions?.[d.id];
      const pct = s ? thanhPhanTram(soCauDaLam(s), d.soY || d.soCau || 1) : 0;
      return examCard(d, { progress: pct });
    }).join('')}</div>`;
  }

  function capNhatUrl() {
    const p = new URLSearchParams();
    if (giaTri.q) p.set('q', giaTri.q);
    if (giaTri.tinh) p.set('tinh', giaTri.tinh);
    if (giaTri.nam) p.set('nam', giaTri.nam);
    const hash = '#/de' + (p.toString() ? `?${p}` : '');
    history.replaceState(null, '', hash);
  }

  return {
    html,
    mount() {
      ve();
      $('#f-q')?.addEventListener('input', (e) => {
        giaTri.q = e.target.value;
        capNhatUrl();
        ve();
      });
      $('#f-tinh')?.addEventListener('change', (e) => {
        giaTri.tinh = e.target.value;
        capNhatUrl();
        ve();
      });
      $('#f-nam')?.addEventListener('change', (e) => {
        giaTri.nam = e.target.value;
        capNhatUrl();
        ve();
      });
    },
  };
}
