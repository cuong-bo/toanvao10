#!/usr/bin/env node
// Kiểm tra chất lượng dữ liệu đề: điểm, id, đáp án số, lời giải, nguồn.
// node tools/audit.js

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const EXAMS = path.join(ROOT, 'site', 'data', 'exams');

(async () => {
  const { giaTriSo } = await import(pathToFileURL(path.join(ROOT, 'site', 'js', 'math.js')).href);
  const files = fs.readdirSync(EXAMS).filter((f) => f.endsWith('.json')).sort();
  let issues = 0;
  for (const f of files) {
    const exam = JSON.parse(fs.readFileSync(path.join(EXAMS, f), 'utf8').replace(/^\uFEFF/, ''));
    const ids = new Set();
    const problems = [];
    let sum = 0;
    for (const q of exam.cauHoi || []) {
      if (ids.has(q.id)) problems.push(`trùng id ${q.id}`);
      ids.add(q.id);
      sum += Number(q.diem) || 0;
      if (!q.loiGiai?.length) problems.push(`thiếu lời giải ${q.id}`);
      if (q.loai === 'dapanso') {
        for (const a of q.dapAn || []) {
          if (giaTriSo(a) === null) problems.push(`đáp án không đọc được: ${q.id} = ${a}`);
        }
      }
    }
    if (Math.abs(sum - 10) > 0.01) problems.push(`tổng điểm ${sum}`);
    if (!exam.nguon?.url && !exam.deMau) problems.push('thiếu URL nguồn');
    console.log(`${String(exam.id).padEnd(16)} ${String(sum).padEnd(6)} ${problems.length ? '⚠ ' + problems.join('; ') : '✓'}`);
    issues += problems.length;
  }
  console.log(`\n${files.length} đề, ${issues} vấn đề.`);
  process.exit(issues ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
