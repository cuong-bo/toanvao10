#!/usr/bin/env node
// Chuyển đề đã kiểm tra nội bộ từ drafts/ sang site/ và cập nhật catalog.
// node tools/publish.js <ma-de>
// node tools/publish.js --all

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DRAFTS = path.join(ROOT, 'drafts');
const DRAFT_EXAMS = path.join(DRAFTS, 'exams');
const SITE_EXAMS = path.join(SITE, 'data', 'exams');
const DRAFT_IMAGES = path.join(DRAFTS, 'images');
const SITE_IMAGES = path.join(SITE, 'images');

function ngay() {
  return new Date().toISOString().slice(0, 10);
}

async function docJson(file) {
  return JSON.parse((await fsp.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
}

async function ghiJson(file, data) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function mucDoChung(exam) {
  const mucs = (exam.cauHoi || []).map((q) => Number(q.mucDo)).filter(Boolean);
  if (!mucs.length) return 'Trung bình';
  const tb = mucs.reduce((a, b) => a + b, 0) / mucs.length;
  if (tb < 1.5) return 'Nền tảng';
  if (tb < 2.3) return 'Trung bình';
  return 'Khá – nâng cao';
}

async function chepAnh(exam) {
  const daChep = new Set();
  const refs = new Set();
  for (const q of exam.cauHoi || []) {
    if (q.hinhAnh?.duongDan) refs.add(q.hinhAnh.duongDan.replace(/^\/+/, ''));
  }
  // Thư mục ảnh cùng tên đề
  const thuMuc = path.join(DRAFT_IMAGES, exam.id);
  if (fs.existsSync(thuMuc)) {
    const dich = path.join(SITE_IMAGES, exam.id);
    await fsp.mkdir(dich, { recursive: true });
    for (const f of await fsp.readdir(thuMuc)) {
      await fsp.copyFile(path.join(thuMuc, f), path.join(dich, f));
      daChep.add(`images/${exam.id}/${f}`);
    }
  }
  // Ảnh tham chiếu nằm rải rác
  for (const ref of refs) {
    if (daChep.has(ref)) continue;
    const nguon = path.join(DRAFTS, ref);
    if (!fs.existsSync(nguon)) continue;
    const dich = path.join(SITE, ref);
    await fsp.mkdir(path.dirname(dich), { recursive: true });
    await fsp.copyFile(nguon, dich);
    daChep.add(ref);
  }
  return [...daChep];
}

async function capNhatCatalog(exam) {
  const catFile = path.join(SITE, 'data', 'catalog.json');
  let catalog = { capNhat: ngay(), de: [] };
  if (fs.existsSync(catFile)) {
    try { catalog = await docJson(catFile); } catch { /* ghi lại */ }
  }
  if (!Array.isArray(catalog.de)) catalog.de = [];
  const soCau = new Set((exam.cauHoi || []).map((q) => q.soCau)).size;
  const entry = {
    id: exam.id,
    tinh: exam.tinh,
    nam: exam.nam,
    tieuDe: exam.tieuDe,
    thoiGian: exam.thoiGian,
    soCau,
    soY: (exam.cauHoi || []).length,
    mucDo: exam.mucDo || mucDoChung(exam),
    deMau: Boolean(exam.deMau),
    ghiChu: exam.ghiChu || '',
    nguon: exam.nguon || { ten: '', url: '' },
    file: `data/exams/${exam.id}.json`,
    capNhat: ngay(),
  };
  if (exam.tags) entry.tags = exam.tags;
  const idx = catalog.de.findIndex((d) => d.id === exam.id);
  if (idx >= 0) catalog.de[idx] = entry;
  else catalog.de.push(entry);
  catalog.de.sort((a, b) => (Number(b.nam) - Number(a.nam)) || String(a.tinh).localeCompare(String(b.tinh), 'vi'));
  catalog.capNhat = ngay();
  await ghiJson(catFile, catalog);
  return entry;
}

function kiemTraDrafts() {
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'validate.js'), '--drafts'], { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

async function publish(id) {
  const draftFile = path.join(DRAFT_EXAMS, `${id}.json`);
  if (!fs.existsSync(draftFile)) throw new Error(`Không thấy bản nháp: drafts/exams/${id}.json`);
  const exam = await docJson(draftFile);
  if (exam.id !== id) throw new Error(`id trong file (${exam.id}) không khớp tên file (${id}).`);
  if (!exam.cauHoi?.length) throw new Error('Đề không có câu hỏi.');

  console.log(`\n→ Đang đăng: ${exam.tinh} ${exam.nam} — ${exam.tieuDe}`);
  await fsp.mkdir(SITE_EXAMS, { recursive: true });
  await fsp.copyFile(draftFile, path.join(SITE_EXAMS, `${id}.json`));
  const anh = await chepAnh(exam);
  if (anh.length) console.log(`  Ảnh: ${anh.length} file.`);
  const entry = await capNhatCatalog(exam);
  // Chỉ xoá nháp sau khi đã ghi xong site
  await fsp.unlink(draftFile);
  const thuMucAnh = path.join(DRAFT_IMAGES, id);
  if (fs.existsSync(thuMucAnh)) await fsp.rm(thuMucAnh, { recursive: true, force: true });
  console.log(`  ✓ Đã đăng ${entry.id} (${entry.soY} ý, ${entry.thoiGian} phút).`);
}

(async () => {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const ids = args.filter((x) => !x.startsWith('--'));

  if (!all && !ids.length) {
    console.log('Cách dùng: node tools/publish.js <ma-de> | --all');
    const list = fs.existsSync(DRAFT_EXAMS) ? fs.readdirSync(DRAFT_EXAMS).filter((f) => f.endsWith('.json')) : [];
    if (list.length) {
      console.log('\nBản nháp đang có:');
      list.forEach((f) => console.log('  - ' + path.basename(f, '.json')));
    }
    process.exit(1);
  }

  if (!kiemTraDrafts()) {
    console.error('\nDừng: bản nháp còn lỗi, hãy sửa rồi đăng lại.');
    process.exit(1);
  }

  const danhSach = all
    ? (fs.existsSync(DRAFT_EXAMS) ? fs.readdirSync(DRAFT_EXAMS).filter((f) => f.endsWith('.json')).map((f) => path.basename(f, '.json')) : [])
    : ids;

  if (!danhSach.length) {
    console.log('Không có bản nháp nào để đăng.');
    process.exit(0);
  }

  let loi = 0;
  for (const id of danhSach) {
    try { await publish(id); } catch (e) { loi++; console.error(`  ✗ ${id}: ${e.message}`); }
  }

  try {
    execFileSync(process.execPath, [path.join(__dirname, 'validate.js')], { stdio: 'inherit' });
  } catch { loi++; }

  console.log(loi ? `\nCó ${loi} lỗi.` : '\nĐăng xong. Mở tools/serve.js để xem lại, rồi tải thư mục site/ lên hosting.');
  process.exit(loi ? 1 : 0);
})().catch((e) => {
  console.error('Lỗi:', e.message);
  process.exit(1);
});
