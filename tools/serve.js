#!/usr/bin/env node
// Máy chủ thử: phục vụ site/ và chế độ xem nháp cho giáo viên.
// Chạy: node tools/serve.js [--port 4173]

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const url = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DRAFTS = path.join(ROOT, 'drafts');
const PORT = Number(process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : process.env.PORT) || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function anToan(base, target) {
  const full = path.resolve(base, '.' + target);
  return full === base || full.startsWith(base + path.sep) ? full : null;
}

async function thongTinDe(file) {
  try {
    const data = JSON.parse((await fsp.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
    const soCau = new Set((data.cauHoi || []).map((q) => q.soCau)).size;
    return {
      id: data.id || path.basename(file, '.json'),
      tinh: data.tinh || '',
      nam: data.nam || '',
      tieuDe: data.tieuDe || '',
      thoiGian: data.thoiGian || 90,
      soCau,
      soY: (data.cauHoi || []).length,
      mucDo: data.mucDo || '',
      deMau: Boolean(data.deMau),
      nguon: data.nguon || null,
      ghiChu: data.ghiChu || '',
      file: `drafts/exams/${path.basename(file)}`,
      capNhat: data.capNhat || '',
    };
  } catch (err) {
    return { id: path.basename(file, '.json'), tieuDe: `[Lỗi JSON] ${path.basename(file)}`, loi: err.message };
  }
}

async function danhSachNhap() {
  const dir = path.join(DRAFTS, 'exams');
  try {
    const files = (await fsp.readdir(dir)).filter((f) => f.endsWith('.json'));
    return await Promise.all(files.map((f) => thongTinDe(path.join(dir, f))));
  } catch {
    return [];
  }
}

function gui(res, status, type, body, extra = {}) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    ...extra,
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsed.pathname || '/');

  if (pathname === '/api/drafts') {
    const list = await danhSachNhap();
    return gui(res, 200, 'application/json; charset=utf-8', JSON.stringify(list));
  }
  if (pathname.startsWith('/api/draft/')) {
    const id = pathname.slice('/api/draft/'.length).replace(/[^a-zA-Z0-9._-]/g, '');
    const file = path.join(DRAFTS, 'exams', `${id}.json`);
    try {
      const raw = await fsp.readFile(file, 'utf8');
      const data = JSON.parse(raw.replace(/^\uFEFF/, ''));
      data._meta = { ...(await thongTinDe(file)), nhap: true };
      return gui(res, 200, 'application/json; charset=utf-8', JSON.stringify(data));
    } catch {
      return gui(res, 404, 'application/json; charset=utf-8', JSON.stringify({ error: 'Không tìm thấy bản nháp' }));
    }
  }

  if (pathname === '/') pathname = '/index.html';
  let file = anToan(SITE, pathname);
  if (!file) return gui(res, 400, 'text/plain; charset=utf-8', 'Đường dẫn không hợp lệ');

  // Ảnh của bản nháp: nếu site/images không có thì thử drafts/images
  try {
    const stat = await fsp.stat(file);
    if (!stat.isFile()) throw new Error('not file');
  } catch {
    if (pathname.startsWith('/images/')) {
      const alt = anToan(DRAFTS, pathname);
      if (alt) {
        try {
          const buf = await fsp.readFile(alt);
          return gui(res, 200, MIME[path.extname(alt)] || 'application/octet-stream', buf);
        } catch { /* rơi xuống 404 */ }
      }
    }
    // Không phải file tĩnh: trả index.html cho đường dẫn do hash xử lý
    if (!path.extname(pathname)) {
      try {
        const html = await fsp.readFile(path.join(SITE, 'index.html'));
        return gui(res, 200, MIME['.html'], html);
      } catch { /* rơi xuống 404 */ }
    }
    return gui(res, 404, 'text/plain; charset=utf-8', 'Không tìm thấy: ' + pathname);
  }

  try {
    const buf = await fsp.readFile(file);
    return gui(res, 200, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', buf);
  } catch {
    return gui(res, 404, 'text/plain; charset=utf-8', 'Không đọc được file');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Trạm tiếp sức Toán vào 10 — máy chủ thử`);
  console.log(`  Mở: http://localhost:${PORT}`);
  console.log(`  Bản nháp: ${path.join(DRAFTS, 'exams')}`);
  console.log(`  Ctrl+C để dừng.\n`);
});
