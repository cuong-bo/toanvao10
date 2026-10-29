#!/usr/bin/env node
// Dựng lại site/data/catalog.json từ các file trong site/data/exams.
// node tools/build-catalog.js

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const EXAMS = path.join(SITE, 'data', 'exams');
const CATALOG = path.join(SITE, 'data', 'catalog.json');

function mucDoChung(exam) {
  const mucs = (exam.cauHoi || []).map((q) => Number(q.mucDo)).filter(Boolean);
  if (!mucs.length) return 'Trung bình';
  const tb = mucs.reduce((a, b) => a + b, 0) / mucs.length;
  if (tb < 1.5) return 'Nền tảng';
  if (tb < 2.3) return 'Trung bình';
  return 'Khá – nâng cao';
}

(async () => {
  const files = fs.readdirSync(EXAMS).filter((f) => f.endsWith('.json')).sort();
  const de = [];
  for (const f of files) {
    try {
      const exam = JSON.parse((await fsp.readFile(path.join(EXAMS, f), 'utf8')).replace(/^\uFEFF/, ''));
      const soCau = new Set((exam.cauHoi || []).map((q) => q.soCau)).size;
      const entry = {
        id: exam.id,
        tinh: exam.tinh,
        nam: exam.nam,
        tieuDe: exam.tieuDe,
        thoiGian: exam.thoiGian || 90,
        soCau,
        soY: (exam.cauHoi || []).length,
        mucDo: exam.mucDo || mucDoChung(exam),
        deMau: Boolean(exam.deMau),
        ghiChu: exam.ghiChu || '',
        nguon: exam.nguon || { ten: '', url: '' },
        file: `data/exams/${f}`,
        capNhat: exam.capNhat || new Date().toISOString().slice(0, 10),
      };
      if (exam.tags) entry.tags = exam.tags;
      de.push(entry);
      console.log(`✓ ${exam.id} — ${exam.tinh} ${exam.nam} (${entry.soY} ý)`);
    } catch (e) {
      console.error(`✗ ${f}: ${e.message}`);
    }
  }
  de.sort((a, b) => (Number(b.nam) - Number(a.nam)) || String(a.tinh).localeCompare(String(b.tinh), 'vi'));
  await fsp.writeFile(CATALOG, JSON.stringify({ capNhat: new Date().toISOString().slice(0, 10), de }, null, 2) + '\n', 'utf8');
  console.log(`\nĐã ghi ${de.length} đề vào catalog.json`);
})().catch((e) => { console.error(e); process.exit(1); });
