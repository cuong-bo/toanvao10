# Hướng dẫn đăng web

## 1. Chuẩn bị nội dung

- Đề đã kiểm tra nội bộ nằm trong `site/data/exams/`.
- `site/data/catalog.json` phải có đúng một mục cho mỗi đề.
- Ảnh nằm trong `site/images/<ma-de>/`.
- Chạy kiểm tra:

```bash
node tools/validate.js
```

Không đăng nếu còn lỗi `✗`.

## 2. Chạy thử trên máy

```bash
node tools/serve.js
```

Mở `http://localhost:4173`. Thử trên cả điện thoại (cùng mạng LAN) nếu cần.

## 3. Đăng lên Cloudflare Pages (khuyến nghị)

1. Vào Cloudflare Pages → Create a project.
2. Chọn “Direct upload”.
3. Kéo thả **toàn bộ nội dung bên trong** thư mục `site/` (không kéo thư mục `site`).
4. Deploy. Mỗi lần cập nhật, tải lại thư mục `site/`.

Có thể dùng Wrangler:

```bash
npx wrangler pages deploy site
```

## 4. Đăng lên GitHub Pages

Repo: `https://github.com/cuong-bo/toanvao10`

1. Nếu repo đang để **private**, vào **Settings → General → Danger Zone → Change repository visibility → Make public**. GitHub Pages cho repo private cần gói trả phí; cách đơn giản nhất là để repo public.
2. Vào **Settings → Pages**.
3. Mục **Build and deployment → Source**, chọn **GitHub Actions**.
4. Vào tab **Actions**, chọn workflow **Deploy static site to GitHub Pages**, bấm **Run workflow** (hoặc push một commit mới).
5. Chờ workflow chạy xong (dấu ✓ xanh). Link công khai:

   `https://cuong-bo.github.io/toanvao10/`

6. Mở link trên điện thoại, thử làm một đề và kiểm tra offline sau lần truy cập đầu.

Nếu link trả 404:

- kiểm tra workflow có lỗi trong tab **Actions**;
- kiểm tra **Settings → Pages** đã chọn **GitHub Actions**;
- kiểm tra repo đã public chưa;
- chờ 1–2 phút sau khi workflow xanh rồi tải lại.

## 5. Đăng lên Netlify

1. Vào Netlify → Add new site → Deploy manually.
2. Kéo thả thư mục `site/`.
3. Mỗi lần cập nhật, kéo thả lại.

## 6. Sau khi đăng

- Mở link bằng điện thoại, kiểm tra:
  - trang chủ và danh sách đề;
  - làm thử một đề, nộp bài, xem kết quả;
  - bật/tắt mạng để thử offline sau lần truy cập đầu;
  - cài lên màn hình chính (PWA).
- Nếu trình duyệt còn giữ bản cũ, tăng `VERSION` trong `site/sw.js` rồi đăng lại.

## 7. Quy trình duyệt đề (giai đoạn hiện tại)

1. Đề nháp: `drafts/exams/<ma-de>.json`, ảnh `drafts/images/<ma-de>/`.
2. Giáo viên xem nội dung, đối chiếu đáp án.
3. Chạy:

```bash
node tools/publish.js <ma-de>
```

4. Kiểm tra lại bằng `node tools/serve.js`, rồi đăng `site/`.

Giao diện duyệt trực quan trên web sẽ được làm ở giai đoạn sau. Hiện tại `tools/serve.js` đã có API `/api/drafts` và `/api/draft/<id>` để chuẩn bị cho màn hình đó.

## 8. Lưu ý

- Không đưa `drafts/` lên hosting.
- Không sửa trực tiếp file trong `site/` nếu vẫn còn bản nháp tương ứng, tránh lệch nội dung.
- Lời giải do AI soạn có thể sai; cần kiểm tra và nhờ giáo viên rà khi có điều kiện. Hiện chưa có giáo viên kiểm duyệt toàn bộ.
