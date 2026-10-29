# Kế hoạch dự án: Trạm tiếp sức Toán vào 10 (khu vực Tây Bắc)

> Cập nhật lần cuối: 2026-10-29
> Trạng thái: **đã triển khai lõi (bước 1–6, bước 8), đã có 25 đề thật + 1 đề mẫu. Hiện chưa có giáo viên kiểm duyệt; lời giải có thể sai, cần kiểm tra và hỏi giáo viên nếu thắc mắc.**
>
> Xem tiến độ thực tế: `README.md`, nguồn đề: `docs/NGUON_DE.md`, hướng dẫn đăng: `docs/HUONG_DAN_DANG.md`.

## 1. Mục tiêu

Web tĩnh, miễn phí (0đ), cho học sinh lớp 9 vùng Tây Bắc (Điện Biên, Lai Châu, Sơn La và các tỉnh lân cận) ôn thi tuyển sinh vào lớp 10 môn Toán.

- Học sinh truy cập và làm bài **không cần tài khoản**.
- Dùng chủ yếu trên **điện thoại**, mạng yếu, nên phải nhẹ và chạy được **offline**.
- Trình độ đa số ở mức trung bình: ưu tiên chắc phần "ăn điểm" (khoảng 7–8 điểm) trước, rồi mới đến câu khó.
- Đề thi thật theo tỉnh/năm là nội dung chính. Hình vẽ khó dựng lại thì dùng **ảnh chụp từ đề gốc**.

## 2. Chức năng

**Nhóm A, lõi**
- [x] Đề thi thật theo tỉnh/năm, có đồng hồ bấm giờ
- [x] Luyện theo chuyên đề (rút gọn biểu thức, phương trình/hệ phương trình, hàm số y = ax² và y = ax + b, định lí Vi-ét, giải bài toán bằng cách lập phương trình, hình học, bất đẳng thức/cực trị)
- [x] Lời giải từng bước, ẩn sẵn; gợi ý theo nấc (gợi ý 1 → gợi ý 2 → lời giải)
- [x] Tự chấm câu đáp án số; câu tự luận thì học sinh tự đánh giá Đúng / Sai / Chưa chắc
- [x] Hiển thị công thức đẹp, đọc tốt trên điện thoại (KaTeX)

**Nhóm B, theo trình độ**
- [x] Ba cấp độ: Nền tảng, Khá, Nâng cao
- [x] Bài kiểm tra đầu vào ngắn (15 phút) và gợi ý chuyên đề nên ôn trước
- [x] Sổ lỗi sai và chế độ "làm lại các câu đã sai"
- [x] Tờ công thức tóm tắt kèm lỗi hay gặp
- [x] Lộ trình ôn 8–12 tuần có checklist tự đánh dấu

**Nhóm C, tiện dụng**
- [x] Chạy offline (PWA), cài lên màn hình chính
- [x] Chia sẻ link đề/câu qua Zalo
- [x] In đề / xuất PDF
- [x] Chế độ tối, chữ lớn
- [x] Lọc và tìm kiếm theo từ khóa, chuyên đề, mức độ

**Làm sau (không thuộc đợt đầu)**
- Đồ thị tương tác (GeoGebra/Desmos)
- Trang quản trị để giáo viên tự thêm câu hỏi
- Bảng xếp hạng / điểm chung cả lớp (cần server)

## 3. Công nghệ

| Phần | Lựa chọn |
|---|---|
| Giao diện | HTML/CSS/JS thuần, không framework, không bước build |
| Định tuyến | Hash (`#/...`), chạy được trên mọi hosting tĩnh |
| Công thức | KaTeX 0.16.11, đóng gói sẵn trong `site/vendor/katex` (không dùng CDN) |
| Dữ liệu | File JSON |
| Lưu tiến độ | `localStorage` trên máy học sinh, có xuất/nhập file tiến độ |
| Offline | Service worker + `manifest.webmanifest` |
| Công cụ | Node.js (đã có v24); **máy không có Python** |
| Hosting | Cloudflare Pages hoặc Netlify (miễn phí), chỉ đăng thư mục `site/` |

## 4. Kiểm duyệt trên web tĩnh không phân quyền

Web tĩnh thì **mọi file đã đăng đều công khai**. Kiểm duyệt ở đây nghĩa là kiểm soát **cái gì được đăng**, không phải ai được xem.

- `site/`: phần được đăng lên mạng, chỉ chứa nội dung **đã kiểm tra nội bộ**.
- `drafts/`: nội dung **bản nháp**, nằm trên máy, **không bao giờ đăng**.

Quy trình mỗi đề:

1. Tìm đề gốc từ nguồn chính thức, ghi lại link.
2. Gõ lại đề, viết lời giải riêng, lưu vào `drafts/exams/`; ảnh để ở `drafts/images/`.
3. Tự kiểm tra lại đáp án bằng cách tính toán độc lập.
4. Giáo viên xem thử bằng chế độ xem duyệt (mở web ở `localhost`, có thanh vàng "BẢN NHÁP"), sửa nếu cần.
5. Đồng ý thì chạy `node tools/publish.js <mã-đề>`: kiểm tra cấu trúc, chuyển sang `site/`, cập nhật `catalog.json`.
6. Đăng thư mục `site/` lên hosting.

Lưu ý:
- Đáp án và lời giải nằm trong JSON nên học sinh biết xem nguồn vẫn đọc được. Với web ôn luyện thì chấp nhận được.
- GitHub Pages với repo riêng tư mất phí. Nếu muốn giữ `drafts/` trong git thì dùng Cloudflare Pages, hoặc không dùng git mà kéo thả `site/`.

**Hiện trạng:** `tools/publish.js`, `tools/validate.js` và API `/api/drafts` của `tools/serve.js` đã có. Giao diện xem duyệt có thanh vàng để làm ở giai đoạn sau theo yêu cầu.

## 5. Cấu trúc thư mục đích

```
D:\GVtoan\
├─ docs\
│  ├─ KE_HOACH.md
│  ├─ NGUON_DE.md
│  └─ HUONG_DAN_DANG.md
├─ site\                       ← phần đăng lên mạng
│  ├─ index.html
│  ├─ manifest.webmanifest, sw.js
│  ├─ css\   (style.css, print.css)
│  ├─ js\    (app.js, router.js, store.js, data.js, math.js, question.js, views\*.js)
│  ├─ vendor\katex\
│  ├─ data\
│  │  ├─ catalog.json
│  │  ├─ topics.json, formulas.json, roadmap.json, entry-test.json
│  │  └─ exams\<tỉnh>-<năm>.json
│  ├─ images\<mã-đề>\
│  └─ icons\
├─ drafts\                     ← bản nháp, KHÔNG đăng
│  ├─ exams\
│  └─ images\
└─ tools\
   ├─ serve.js
   ├─ validate.js
   ├─ publish.js
   └─ build-catalog.js
```

## 6. Khung dữ liệu

```
Đề: { id, tinh, nam, tieuDe, thoiGian (phút), nguon: {ten, url},
      cauHoi: [ ... ] }

Câu: { id, soCau, y?, chuyenDe, mucDo (1-3), diem,
       deBai        (chữ + $LaTeX$),
       hinhAnh?     { duongDan, moTa },
       loai         "tuluan" | "dapanso" | "tracnghiem",
       phuongAn?    (tracnghiem: [{ma, noiDung}]),
       dapAn?       (dapanso/tracnghiem: danh sách giá trị chấp nhận),
       goiY         [ ... ],
       loiGiai      [ các bước ] }
```

- Câu nhiều ý (a, b, c) chia thành ý con để học sinh tự đánh giá riêng từng ý.
- `catalog.json` liệt kê các đề đã đăng (web tĩnh không liệt kê được thư mục).
- Đáp án số chấp nhận nhiều cách viết: `1/2`, `0,5`, `0.5`.
- Câu trắc nghiệm được bổ sung cho các đề mới (Sơn La 2025, Yên Bái 2022); câu trả lời ngắn vẫn dùng `dapanso`.

## 7. Các màn hình

| Đường dẫn | Nội dung |
|---|---|
| `#/` | Trang chủ: tiếp tục bài đang làm, lối vào đề, chuyên đề, sổ lỗi sai |
| `#/de` | Danh sách đề, lọc theo tỉnh/năm |
| `#/de/:id` | Giới thiệu đề, chọn có/không bấm giờ |
| `#/lam/:id` | Làm bài: đồng hồ, thanh nhảy câu, nhập đáp án, gợi ý, lời giải |
| `#/ket-qua/:id` | Tổng kết: đúng/sai/chưa chắc, theo chuyên đề |
| `#/chuyen-de`, `#/chuyen-de/:ma` | Luyện theo chuyên đề và mức độ |
| `#/luyen?cd=...&muc=...` | Phiên luyện tập (chuyên đề, sổ lỗi, câu đã chọn) |
| `#/cau/:examId/:qid` | Xem/làm lại một câu, dùng để chia sẻ |
| `#/so-loi` | Sổ lỗi sai, làm lại câu sai |
| `#/cong-thuc` | Tờ công thức, lỗi hay gặp |
| `#/lo-trinh` | Lộ trình 8–12 tuần |
| `#/kiem-tra` | Bài kiểm tra đầu vào 15 phút |
| `#/in/:id` | Bản in / xuất PDF |
| `#/cai-dat` | Giao diện, cỡ chữ, xuất/nhập tiến độ |
| `#/gioi-thieu` | Giới thiệu, nguồn, bản quyền |

## 8. Yêu cầu phi chức năng

- Mobile-first: nút bấm lớn, chữ tối thiểu 16px, có chế độ chữ lớn và chế độ tối.
- Khung web dưới 1MB (không tính ảnh); không tải tài nguyên từ CDN.
- Ảnh hình vẽ: cắt gọn, đổi sang WebP, mục tiêu dưới 80KB mỗi ảnh, có mô tả `alt`.
- Mọi thao tác `localStorage` bọc `try/catch`; web vẫn chạy khi bị chặn lưu trữ.
- Kiểm tra bằng Lighthouse (hiệu năng, khả năng truy cập, PWA); thử trên Chrome điện thoại, mạng chậm và offline.
- Kết quả Lighthouse mobile hiện tại: Hiệu năng 91, Khả năng truy cập 100, Best Practices 100, SEO 100.

## 9. Các bước thực hiện và tiến độ

Tick `[x]` khi xong; mỗi bước có tiêu chí hoàn thành để kiểm tra.

- [x] **Bước 1. Nền tảng:** chốt cấu trúc thư mục, khung dữ liệu, `validate.js`, `serve.js`.
  *Xong khi:* chạy `node tools/serve.js` mở được trang trống.
- [x] **Bước 2. Khung giao diện:** định tuyến, nạp KaTeX, trang chủ, danh sách đề.
  *Xong khi:* hiện danh sách đề đọc từ `catalog.json`.
- [x] **Bước 3. Màn hình làm bài:** đồng hồ, chấm đáp án số, gợi ý/lời giải, ảnh minh họa.
  *Xong khi:* làm trọn một đề mẫu từ đầu đến cuối.
- [x] **Bước 4. Kết quả và lưu trữ:** trang kết quả, lưu tiến độ, sổ lỗi sai, xuất/nhập tiến độ.
  *Xong khi:* tắt trình duyệt mở lại vẫn còn tiến độ.
- [x] **Bước 5. Học theo trình độ:** luyện theo chuyên đề, tờ công thức, lộ trình, bài kiểm tra đầu vào.
  *Xong khi:* lọc được câu theo chuyên đề và mức độ.
- [x] **Bước 6. Tiện dụng:** PWA offline, chia sẻ Zalo, in PDF, chế độ tối/chữ lớn.
  *Xong khi:* tắt mạng vẫn dùng được.
- [ ] **Bước 7. Kiểm duyệt và đăng:** chế độ xem duyệt, `publish.js`, hướng dẫn đăng lên hosting.
  *Đã có:* `publish.js`, API `/api/drafts`, hướng dẫn đăng. *Còn:* giao diện xem duyệt có thanh vàng — làm sau theo yêu cầu.
- [x] **Bước 8. Nội dung:** thêm 1–2 đề thật đại diện, rồi mở rộng từng đợt (3–5 đề mỗi đợt).
  *Đã có:* 25 đề thật thuộc 15 tỉnh/thành, 430 câu/ý (gồm đề mẫu), có lời giải; xem `docs/NGUON_DE.md`.

**Về đề trong lúc dựng khung (bước 1–7):** dùng *đề minh họa tự soạn*, ghi rõ "Đề mẫu để thử web, không phải đề thi thật", gồm đủ các loại câu (tự luận, đáp án số, có ảnh). Đến bước 8 mới thay bằng đề thật, ghi nguồn.

## 10. Thu thập đề thật (bước 8)

- Chỉ lấy **đề chính thức do Sở GD&ĐT công bố**, ghi rõ nguồn (tỉnh, năm, link).
- **Không cào hàng loạt** lời giải/đề từ các trang có bản quyền (Tuyensinh247, Vietjack, Loigiaihay, trung tâm, trường tư…). Lời giải do tự soạn.
- Tỉnh nào không công bố đề trực tuyến hoặc chỉ có ảnh mờ thì ghi nhận là thiếu, không tự bịa.
- Địa giới hành chính đã thay đổi (ví dụ Yên Bái vào Lào Cai, Hòa Bình vào Phú Thọ): cần kiểm tra lại, có thể giữ tên tỉnh theo thời điểm ra đề.
- Cấu trúc đề mỗi tỉnh khác nhau (số câu, thang điểm); khung dữ liệu đã thiết kế linh hoạt.
- Bảng theo dõi nguồn đề chi tiết: xem `docs/NGUON_DE.md`.

| Tỉnh | Năm | Có đề? | Link nguồn | Trạng thái |
|---|---|---|---|---|
| Điện Biên | 2022, 2023 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Lai Châu | 2026 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Sơn La | 2021, 2022, 2025 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Lào Cai | 2021, 2022, 2023, 2024 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Yên Bái | 2022 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Hòa Bình | 2020, 2021, 2022, 2024, 2025 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Hà Nội | 2024 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Nam Định | 2023 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Bắc Ninh | 2022 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Hải Dương | 2022 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Hải Phòng | 2022 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Nghệ An | 2022 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Thanh Hóa | 2022 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Vĩnh Phúc | 2021 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |
| Thái Bình | 2020 | Có | Xem `docs/NGUON_DE.md` | Đã đăng |

## 11. Rủi ro

| Rủi ro | Cách giảm |
|---|---|
| Lời giải/đáp án do AI soạn có thể sai | Tự kiểm tra độc lập; nhờ giáo viên rà khi có điều kiện |
| Hình học có hình vẽ tốn công | Dùng ảnh chụp từ đề gốc, hoặc dựng SVG đơn giản |
| Thiếu đề trực tuyến của một số tỉnh | Báo rõ, làm trước các tỉnh có đề |
| Bản quyền nội dung | Chỉ dùng đề chính thức, tự soạn lời giải, ghi nguồn |
| Dữ liệu tiến độ chỉ nằm trên máy học sinh | Có xuất/nhập file tiến độ |
| Học sinh xem đáp án qua JSON | Chấp nhận với web ôn luyện |
| Câu in sai trong đề gốc | Ghi chú rõ và chuyển dạng câu hỏi phù hợp (ví dụ câu 39 Yên Bái 2022) |

## 12. Việc cần quyết định

- [ ] Hosting: Cloudflare Pages (khuyến nghị) hay Netlify (có thể quyết sau).
- [x] Đồng ý cấu trúc `site/` + `drafts/` + `tools/`.
- [x] Xác nhận bắt đầu từ Bước 1.

## 13. Hiện trạng thư mục

Đến 2026-10-29:

- `site/` đã có đầy đủ giao diện, dữ liệu, KaTeX, icon, manifest, service worker.
- 26 đề trong `catalog.json` (25 đề thật + 1 đề mẫu), 430 câu/ý.
- `drafts/` trống, sẵn sàng cho đợt đề tiếp theo.
- `tools/` có `serve.js`, `validate.js`, `publish.js`, `build-catalog.js`.
- Đã kiểm thử Playwright, Lighthouse; xem `README.md`.
