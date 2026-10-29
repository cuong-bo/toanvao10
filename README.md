# Trạm tiếp sức Toán vào 10

Web ôn thi vào lớp 10 môn Toán cho học sinh cả nước, ưu tiên học sinh vùng khó khăn. Web tĩnh, không framework, không bước build, chạy được offline sau lần truy cập đầu.

## Chạy thử

```bash
node tools/serve.js
# mở http://localhost:4173
```

Máy chủ thử phục vụ thư mục `site/`, đồng thời mở API đọc các đề trong `drafts/` để giáo viên xem nháp.

## Kiểm tra dữ liệu

```bash
node tools/validate.js          # kiểm tra phần đã đăng trong site/
node tools/validate.js --drafts # kiểm tra bản nháp
node tools/validate.js --all
node tools/audit.js             # kiểm tra điểm, id, đáp án số, lời giải, nguồn
```

## Đăng một đề

1. Đặt đề nháp tại `drafts/exams/<ma-de>.json`, ảnh tại `drafts/images/<ma-de>/`.
2. Chạy `node tools/validate.js --drafts`.
3. Tự kiểm tra nội dung và lời giải; hiện chưa có giáo viên kiểm duyệt.
4. Chạy `node tools/publish.js <ma-de>` để chuyển sang `site/` và cập nhật `site/data/catalog.json`.
5. Tải thư mục `site/` lên Cloudflare Pages hoặc Netlify.

Nếu thêm/sửa đề trực tiếp trong `site/data/exams/`:

```bash
node tools/build-catalog.js
```

## Cấu trúc

```
site/                 phần được đăng
  index.html
  css/ js/ vendor/ icons/
  data/               catalog, chuyên đề, công thức, lộ trình, đề
  images/             hình vẽ theo mã đề
drafts/               bản nháp, KHÔNG đăng
  exams/ images/
tools/                serve, validate, publish, build-catalog
docs/                 kế hoạch, nguồn đề, hướng dẫn đăng
```

## Hiện trạng dữ liệu

- 35 đề thật của 20 tỉnh/thành: Điện Biên, Hòa Bình, Lai Châu, Lào Cai, Sơn La, Yên Bái, Hà Nội, Nam Định, Bắc Ninh, Hải Dương, Hải Phòng, Nghệ An, Thanh Hóa, Vĩnh Phúc, Thái Bình, TP. Hồ Chí Minh, Đà Nẵng, Cần Thơ, Quảng Ninh, Thừa Thiên Huế.
- 1 đề mẫu để thử web (ghi rõ không phải đề thật).
- 580 câu/ý, có lời giải từng bước; một số câu hình học nâng cao dùng bổ đề hoặc toạ độ.
- Đề Yên Bái 2022 có 50 câu; câu 39 bản in sai đáp án nên chuyển thành câu trả lời ngắn (đáp án đúng 6/5).

## Kiểm thử

Đã kiểm thử bằng Playwright (Chromium) ở kích thước điện thoại 390×844 và desktop 1280×900:

- điều hướng tất cả màn hình, không lỗi console;
- làm bài, chấm đáp án số, trắc nghiệm, tự luận, gợi ý/lời giải;
- nộp bài, kết quả, sổ lỗi, luyện chuyên đề, kiểm tra đầu vào;
- lưu/khôi phục tiến độ, xuất/nhập JSON, đồng hồ tự nộp;
- PWA offline (service worker), ảnh hình vẽ;
- Lighthouse mobile: Hiệu năng 91, Khả năng truy cập 100, Best Practices 100, SEO 100.

## Việc để sau

- Giao diện duyệt bài cho giáo viên (bản nháp đã có API và quy trình publish).
- Thêm đề các năm/tỉnh còn thiếu; bổ sung hình vẽ cho câu hình học.
- Đồ thị tương tác, tài khoản giáo viên, bảng xếp hạng (cần máy chủ).
