#!/usr/bin/env node
// Kiểm tra cấu trúc dữ liệu.
// node tools/validate.js            -> kiểm tra site/
// node tools/validate.js --drafts   -> kiểm tra drafts/
// node tools/validate.js --all      -> cả hai

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DRAFTS = path.join(ROOT, 'drafts');

let errors = 0;
let warnings = 0;

const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => { warnings++; console.log(`  ! ${msg}`); };
const err = (msg) => { errors++; console.log(`  ✗ ${msg}`); };

function docJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function kiemTraDe(exam, { file, imageBase }) {
  const ten = path.basename(file);
  console.log(`\nĐề: ${ten}`);

  if (!exam || typeof exam !== 'object') { err('File không phải object JSON.'); return; }
  for (const f of ['id', 'tinh', 'tieuDe']) {
    if (!exam[f] || typeof exam[f] !== 'string') err(`Thiếu hoặc sai trường "${f}".`);
  }
  if (!Number.isFinite(Number(exam.nam))) err('Trường "nam" phải là số.');
  if (!Number.isFinite(Number(exam.thoiGian)) || Number(exam.thoiGian) <= 0) err('Trường "thoiGian" phải là số phút > 0.');
  if (!exam.nguon || typeof exam.nguon !== 'object') err('Thiếu trường "nguon" (ten, url).');
  else if (!exam.nguon.ten) err('Nguồn thiếu "ten".');
  if (!Array.isArray(exam.cauHoi) || !exam.cauHoi.length) { err('Đề không có câu hỏi.'); return; }

  const ids = new Set();
  const soCauSet = new Set();
  let tongDiem = 0;

  exam.cauHoi.forEach((q, i) => {
    const vt = `cauHoi[${i}]`;
    if (!q || typeof q !== 'object') { err(`${vt} không phải object.`); return; }
    if (!q.id || typeof q.id !== 'string') err(`${vt}.id thiếu hoặc sai.`);
    else if (ids.has(q.id)) err(`${vt}.id trùng: ${q.id}`);
    else ids.add(q.id);

    if (q.soCau === undefined || q.soCau === null || q.soCau === '') err(`${vt}.soCau thiếu.`);
    else soCauSet.add(q.soCau);
    if (!Number.isFinite(Number(q.diem)) || Number(q.diem) < 0) err(`${vt}.diem phải là số >= 0.`);
    else tongDiem += Number(q.diem);
    if (![1, 2, 3].includes(Number(q.mucDo))) err(`${vt}.mucDo phải là 1, 2 hoặc 3.`);
    if (!q.chuyenDe) err(`${vt}.chuyenDe thiếu.`);
    if (!q.deBai || typeof q.deBai !== 'string') err(`${vt}.deBai thiếu.`);

    if (!['tuluan', 'dapanso', 'tracnghiem'].includes(q.loai)) err(`${vt}.loai phải là "tuluan", "dapanso" hoặc "tracnghiem".`);
    if (q.loai === 'dapanso') {
      if (!Array.isArray(q.dapAn) || !q.dapAn.length) err(`${vt}.dapAn thiếu (câu đáp án số cần ít nhất 1 giá trị).`);
      else if (q.dapAn.some((x) => String(x).trim() === '')) err(`${vt}.dapAn có giá trị rỗng.`);
    }
    if (q.loai === 'tracnghiem') {
      if (!Array.isArray(q.phuongAn) || q.phuongAn.length < 2) err(`${vt}.phuongAn phải có ít nhất 2 phương án.`);
      else {
        const mas = q.phuongAn.map((p) => String(p.ma || '').trim().toUpperCase());
        if (mas.some((m) => !m)) err(`${vt}.phuongAn có phương án thiếu mã.`);
        if (new Set(mas).size !== mas.length) err(`${vt}.phuongAn có mã trùng.`);
        if (q.phuongAn.some((p) => !p.noiDung)) err(`${vt}.phuongAn có phương án thiếu nội dung.`);
        if (!Array.isArray(q.dapAn) || !q.dapAn.length) err(`${vt}.dapAn thiếu cho câu trắc nghiệm.`);
        else if (q.dapAn.some((x) => !mas.includes(String(x).trim().toUpperCase()))) err(`${vt}.dapAn không khớp mã phương án.`);
      }
    }
    if (q.goiY !== undefined && !Array.isArray(q.goiY)) err(`${vt}.goiY phải là mảng.`);
    if (!Array.isArray(q.loiGiai) || !q.loiGiai.length) err(`${vt}.loiGiai phải là mảng có ít nhất 1 bước.`);
    else if (q.loiGiai.some((x) => typeof x !== 'string' || !x.trim())) err(`${vt}.loiGiai có bước rỗng hoặc không phải chuỗi.`);

    if (q.hinhAnh) {
      if (!q.hinhAnh.duongDan) err(`${vt}.hinhAnh.duongDan thiếu.`);
      else {
        const img = path.join(imageBase, q.hinhAnh.duongDan.replace(/^\/+/, ''));
        if (!fs.existsSync(img)) err(`${vt}.hinhAnh không tồn tại: ${q.hinhAnh.duongDan}`);
        else if (!q.hinhAnh.moTa) warn(`${vt}.hinhAnh thiếu mô tả alt.`);
      }
    }
  });

  if (Math.abs(tongDiem - 10) > 0.01) warn(`Tổng điểm là ${tongDiem}, không phải 10.`);
  ok(`${exam.cauHoi.length} ý / ${soCauSet.size} câu, tổng ${tongDiem} điểm.`);
}

function kiemTraCatalog(catalog, exams) {
  console.log('\nDanh mục catalog.json');
  if (!catalog || !Array.isArray(catalog.de)) { err('catalog.json thiếu mảng "de".'); return; }
  const ids = new Set();
  for (const d of catalog.de) {
    if (!d.id) { err('Có mục thiếu id.'); continue; }
    if (ids.has(d.id)) err(`Mục trùng id: ${d.id}`);
    ids.add(d.id);
    if (!d.file) { err(`Đề ${d.id} thiếu "file".`); continue; }
    const file = path.join(SITE, d.file);
    if (!fs.existsSync(file)) { err(`Đề ${d.id}: không thấy file ${d.file}`); continue; }
    try {
      const exam = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
      if (exam.id !== d.id) err(`Đề ${d.id}: id trong file là ${exam.id}.`);
      if (String(exam.nam) !== String(d.nam)) err(`Đề ${d.id}: năm trong catalog (${d.nam}) khác file (${exam.nam}).`);
      if (exam.tinh !== d.tinh) err(`Đề ${d.id}: tỉnh trong catalog khác file.`);
      if (!exams.has(d.id)) {
        kiemTraDe(exam, { file, imageBase: SITE });
        exams.set(d.id, exam);
      }
    } catch (e) {
      err(`Đề ${d.id}: JSON lỗi — ${e.message}`);
    }
  }
  for (const id of exams.keys()) {
    if (!ids.has(id)) warn(`Đề ${id} có trong data/exams nhưng không có trong catalog.`);
  }
  ok(`${catalog.de.length} đề trong danh mục.`);
}

async function kiemTraThuMuc(base, { catalog = true, examsDirRel = path.join('data', 'exams') } = {}) {
  const examsDir = path.join(base, examsDirRel);
  const exams = new Map();
  if (!fs.existsSync(examsDir)) { err(`Không thấy ${examsDir}`); return; }
  const files = fs.readdirSync(examsDir).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) warn('Chưa có file đề nào.');

  for (const f of files) {
    const file = path.join(examsDir, f);
    try {
      const exam = docJson(file);
      kiemTraDe(exam, { file, imageBase: base });
      exams.set(exam.id || f, exam);
    } catch (e) {
      err(`${f}: JSON lỗi — ${e.message}`);
    }
  }

  if (catalog) {
    const catFile = path.join(base, 'data', 'catalog.json');
    if (!fs.existsSync(catFile)) err('Thiếu data/catalog.json');
    else {
      try { kiemTraCatalog(docJson(catFile), exams); }
      catch (e) { err(`catalog.json lỗi — ${e.message}`); }
    }
  }
  return exams;
}

async function kiemTraPhuTro() {
  console.log('\nDữ liệu phụ');
  const topicsFile = path.join(SITE, 'data', 'topics.json');
  try {
    const topics = docJson(topicsFile).chuyenDe || [];
    if (!topics.length) err('topics.json không có chuyên đề.');
    const mas = new Set(topics.map((t) => t.ma));
    const examsDir = path.join(SITE, 'data', 'exams');
    const used = new Set();
    if (fs.existsSync(examsDir)) {
      for (const f of fs.readdirSync(examsDir).filter((x) => x.endsWith('.json'))) {
        try {
          const exam = docJson(path.join(examsDir, f));
          for (const q of exam.cauHoi || []) {
            if (!mas.has(q.chuyenDe)) err(`${f}: chuyên đề "${q.chuyenDe}" không có trong topics.json.`);
            used.add(q.chuyenDe);
          }
        } catch { /* đã báo ở trên */ }
      }
    }
    for (const ma of mas) if (!used.has(ma)) warn(`Chuyên đề "${ma}" chưa có câu hỏi nào.`);
    ok(`${topics.length} chuyên đề.`);
  } catch (e) {
    err(`topics.json lỗi — ${e.message}`);
  }

  for (const [ten, key] of [['formulas.json', 'nhom'], ['roadmap.json', 'tuan'], ['entry-test.json', 'cauHoi']]) {
    try {
      const data = docJson(path.join(SITE, 'data', ten));
      if (!Array.isArray(data[key]) || !data[key].length) err(`${ten}: mảng "${key}" rỗng.`);
      else ok(`${ten}: ${data[key].length} mục.`);
    } catch (e) {
      err(`${ten} lỗi — ${e.message}`);
    }
  }
}

(async () => {
  const args = process.argv.slice(2);
  const lamDrafts = args.includes('--drafts') || args.includes('--all');
  const lamSite = !args.includes('--drafts') || args.includes('--all');

  console.log('Kiểm tra dữ liệu Trạm tiếp sức Toán vào 10');
  if (lamSite) {
    console.log('\n=== SITE (đã đăng) ===');
    await kiemTraThuMuc(SITE);
    await kiemTraPhuTro();
  }
  if (lamDrafts) {
    console.log('\n=== DRAFTS (bản nháp) ===');
    await kiemTraThuMuc(DRAFTS, { catalog: false, examsDirRel: 'exams' });
  }

  console.log(`\nKết quả: ${errors} lỗi, ${warnings} cảnh báo.`);
  process.exit(errors ? 1 : 0);
})().catch((e) => {
  console.error('Lỗi không mong muốn:', e);
  process.exit(1);
});
