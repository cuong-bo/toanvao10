# Quy trình chất lượng dữ liệu (phương án A)

Mục tiêu: mỗi đợt thêm **10–15 đề**, ưu tiên đúng và kiểm tra được hơn là chạy theo số lượng.

## 1. Chọn đề

- Chỉ lấy đề chính thức do Sở GD&ĐT công bố.
- Ưu tiên đề có **đáp án/hướng dẫn chấm chính thức** để đối chiếu.
- Ghi link nguồn vào `docs/NGUON_DE.md`.
- Không đưa đề không rõ nguồn, đề nhớ lại hoặc đề tự chế vào `site/`.

## 2. Nhập và giải

- Gõ lại đề, giữ đúng số câu, thang điểm, điều kiện.
- Tự giải độc lập, không sao chép lời giải từ trang khác.
- Câu đáp án số: ghi danh sách giá trị chấp nhận.
- Câu hình học: vẽ hình hoặc mô tả rõ; câu quá phức tạp có thể dùng bổ đề nhưng phải ghi rõ.

## 3. Kiểm tra

- Đối chiếu đáp án cuối với đáp án chính thức.
- Kiểm tra lại phép tính, điều kiện, dấu bằng.
- Chạy:

```bash
node tools/validate.js --drafts
```

- Kiểm tra trên web bằng Playwright: mở đề, làm thử, xem gợi ý/lời giải, kết quả, in, offline.

## 4. Trạng thái

- Hiện **chưa có giáo viên kiểm duyệt toàn bộ**.
- Không gắn nhãn “đã được giáo viên duyệt”.
- Mọi đề đều hiển thị cảnh báo: *Lời giải do nhóm biên soạn, có thể sai; hãy kiểm tra lại và hỏi giáo viên nếu thắc mắc.*
- Khi có giáo viên rà thật, mới thêm trạng thái duyệt riêng.

## 5. Đăng

```bash
node tools/publish.js <ma-de>
```

Chỉ đăng khi `validate` không còn lỗi và đã thử bằng Playwright.

## 6. Nhịp độ

- Mỗi đợt 10–15 đề.
- Ưu tiên các tỉnh/thành có truyền thống học tập tốt và có đáp án chính thức.
- Các năm còn thiếu ghi vào bảng độ phủ, không bịa.
