// Nạp dữ liệu JSON

const cache = new Map();
let draftsCache = null;
let draftsError = null;

async function layJson(url) {
  if (cache.has(url)) return cache.get(url);
  const p = fetch(url, { cache: 'no-store' }).then(async (res) => {
    if (!res.ok) throw new Error(`Không tải được ${url} (${res.status})`);
    return res.json();
  });
  cache.set(url, p);
  try { return await p; } catch (err) { cache.delete(url); throw err; }
}

export function xoaCache() { cache.clear(); draftsCache = null; draftsError = null; }

export async function taiCatalog() {
  const data = await layJson('data/catalog.json');
  return Array.isArray(data.de) ? data.de : [];
}

export async function taiChuyenDe() {
  const data = await layJson('data/topics.json');
  return Array.isArray(data.chuyenDe) ? data.chuyenDe : [];
}

export async function taiDe(id) {
  const catalog = await taiCatalog();
  const meta = catalog.find((d) => d.id === id);
  if (!meta) throw new Error('Không tìm thấy đề này trong danh mục.');
  const exam = await layJson(meta.file || `data/exams/${id}.json`);
  return { ...exam, _meta: meta };
}

export async function taiDeNhap(id) {
  const data = await layJson(`/api/draft/${encodeURIComponent(id)}`);
  return { ...data, _meta: { ...(data._meta || {}), nhap: true } };
}

export async function taiDanhSachNhap() {
  if (draftsCache) return draftsCache;
  if (draftsError) return [];
  try {
    const res = await fetch('/api/drafts', { cache: 'no-store' });
    if (!res.ok) throw new Error('không có máy chủ duyệt');
    const list = await res.json();
    draftsCache = Array.isArray(list) ? list : [];
    return draftsCache;
  } catch (err) {
    draftsError = err;
    return [];
  }
}

/** Nạp toàn bộ đề (dùng cho luyện chuyên đề / sổ lỗi). */
export async function taiTatCaDe() {
  const catalog = await taiCatalog();
  const ds = await Promise.all(catalog.map(async (meta) => {
    try {
      const exam = await layJson(meta.file || `data/exams/${meta.id}.json`);
      return { ...exam, _meta: meta };
    } catch (err) {
      console.warn('Bỏ qua đề lỗi:', meta.id, err);
      return null;
    }
  }));
  return ds.filter(Boolean);
}

export async function taiCongThuc() {
  return layJson('data/formulas.json');
}

export async function taiLoTrinh() {
  return layJson('data/roadmap.json');
}

export async function taiKiemTraDauVao() {
  return layJson('data/entry-test.json');
}

/** Ghép câu hỏi kèm thông tin đề để hiển thị trong sổ lỗi / luyện tập. */
export function ganThongTinDe(exam) {
  return (exam.cauHoi || []).map((q) => ({
    ...q,
    examId: exam.id,
    examTitle: exam.tieuDe,
    tinh: exam.tinh,
    nam: exam.nam,
    _meta: exam._meta,
  }));
}
