// Công thức KaTeX + chấm đáp án số

const DELIMS = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '\\(', right: '\\)', display: false },
  { left: '$', right: '$', display: false },
];

/** Render mọi công thức trong một phần tử. */
export function renderMath(root) {
  if (!root) return;
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(root, {
        delimiters: DELIMS,
        throwOnError: false,
        strict: 'ignore',
        trust: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
      });
      return;
    } catch (err) {
      console.warn('KaTeX auto-render lỗi:', err);
    }
  }
  // Dự phòng: render từng $...$
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.parentElement?.closest('.katex, script, style, pre, code')) continue;
    if (n.nodeValue && /\$[^$]+\$/.test(n.nodeValue)) nodes.push(n);
  }
  for (const node of nodes) {
    const span = document.createElement('span');
    span.innerHTML = node.nodeValue.replace(/\$([^$]+)\$/g, (_, tex) => {
      try {
        return window.katex?.renderToString(tex, { throwOnError: false, strict: 'ignore' }) || _;
      } catch { return _; }
    });
    node.replaceWith(span);
  }
}

/** Chuẩn hoá chữ để so sánh: bỏ khoảng trắng, đổi dấu phẩy thập phân. */
export function chuanHoaDapAn(raw = '') {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[−–—]/g, '-')
    .replace(/,/g, '.')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√/g, 'sqrt')
    .replace(/π/g, 'pi')
    .replace(/[\[\]{}]/g, '');
}

const SO = /^[0-9]+(?:\.[0-9]+)?/;

/**
 * Tính giá trị số của biểu thức đơn giản: 1/2, 0,5, sqrt(2), 2sqrt3, pi...
 * Trả về null nếu không phải biểu thức số.
 */
export function giaTriSo(raw) {
  let s = String(raw).trim();
  // Hỗ trợ cách viết hàng nghìn: 1.250.000 hoặc 1,250,000
  if (/^\d{1,3}(?:\.\d{3}){2,}$/.test(s) || /^\d{1,3}(?:,\d{3}){2,}$/.test(s)) {
    s = s.replace(/[.,]/g, '');
  }
  s = chuanHoaDapAn(s);
  if (!s) return null;
  s = s.replace(/^[a-z]=/, ''); // x=1, y=-2
  s = s.replace(/^=+/, '');
  if (!s) return null;

  let i = 0;
  const peek = () => s[i];
  const skip = () => { while (s[i] === ' ') i++; };

  function parseExpr() {
    let v = parseTerm();
    if (v === null) return null;
    for (;;) {
      skip();
      const c = peek();
      if (c === '+' || c === '-') {
        i++;
        const r = parseTerm();
        if (r === null) return null;
        v = c === '+' ? v + r : v - r;
      } else break;
    }
    return v;
  }

  function parseTerm() {
    let v = parseUnary();
    if (v === null) return null;
    for (;;) {
      skip();
      const c = peek();
      if (c === '*' || c === '/') {
        i++;
        const r = parseUnary();
        if (r === null) return null;
        if (c === '/' && Math.abs(r) < 1e-15) return null;
        v = c === '*' ? v * r : v / r;
      } else if (c === '(' || c === 's' || c === 'p' || /[0-9]/.test(c || '') || c === '√') {
        // nhân ngầm: 2sqrt3, 2(3), 2pi
        const r = parseUnary();
        if (r === null) return null;
        v *= r;
      } else break;
    }
    return v;
  }

  function parseUnary() {
    skip();
    const c = peek();
    if (c === '+') { i++; return parseUnary(); }
    if (c === '-') { i++; const v = parseUnary(); return v === null ? null : -v; }
    return parsePower();
  }

  function parsePower() {
    const base = parsePrimary();
    if (base === null) return null;
    skip();
    if (peek() === '^') {
      i++;
      const exp = parseUnary();
      if (exp === null) return null;
      return Math.pow(base, exp);
    }
    return base;
  }

  function parsePrimary() {
    skip();
    const c = peek();
    if (c === undefined) return null;
    if (c === '(') {
      i++;
      const v = parseExpr();
      skip();
      if (peek() !== ')') return null;
      i++;
      return v;
    }
    if (s.startsWith('sqrt', i)) {
      i += 4;
      skip();
      let arg;
      if (peek() === '(') {
        i++;
        arg = parseExpr();
        skip();
        if (peek() !== ')') return null;
        i++;
      } else {
        arg = parsePrimary();
      }
      if (arg === null || arg < 0) return null;
      return Math.sqrt(arg);
    }
    if (s.startsWith('pi', i)) { i += 2; return Math.PI; }
    if (s.startsWith('e', i) && !/[a-z]/.test(s[i + 1] || '')) { i += 1; return Math.E; }
    const m = s.slice(i).match(SO);
    if (m) {
      i += m[0].length;
      return Number(m[0]);
    }
    return null;
  }

  const value = parseExpr();
  skip();
  if (i !== s.length || value === null || !Number.isFinite(value)) return null;
  return value;
}

/** So khớp một giá trị nhập với danh sách đáp án chấp nhận. */
export function kiemTraDapAn(nhap, dapAn = []) {
  const list = Array.isArray(dapAn) ? dapAn : [dapAn];
  const raw = String(nhap ?? '').trim();
  if (!raw) return { daNhap: false, dung: false };
  const a = giaTriSo(raw);
  for (const d of list) {
    const b = giaTriSo(d);
    if (a !== null && b !== null) {
      const eps = 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
      if (Math.abs(a - b) <= eps) return { daNhap: true, dung: true };
    } else if (chuanHoaDapAn(raw) === chuanHoaDapAn(d)) {
      return { daNhap: true, dung: true };
    }
  }
  return { daNhap: true, dung: false };
}

/** Hiển thị đáp án đẹp: giữ nguyên dạng gốc, nối bằng dấu chấm phẩy. */
export function hienThiDapAn(dapAn = []) {
  const list = Array.isArray(dapAn) ? dapAn : [dapAn];
  return list.map((x) => String(x)).join('; ');
}
