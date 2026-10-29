export function gioiThieu() {
  return `
    <div class="page-head">
      <div>
        <div class="eyebrow">Về dự án</div>
        <h1>Giới thiệu &amp; bản quyền</h1>
        <p class="lead">Trạm tiếp sức Toán vào 10 — web ôn thi vào lớp 10 môn Toán dành cho học sinh các tỉnh Tây Bắc và vùng lân cận.</p>
      </div>
    </div>

    <div class="split two-col">
      <div>
        <div class="card card-pad">
          <h2 style="font-size:1.1rem">Mục tiêu</h2>
          <p>Giúp học sinh lớp 9 vùng khó khăn có một nơi ôn thi nhẹ, miễn phí, dùng được trên điện thoại và cả khi mất mạng. Ưu tiên chắc phần cơ bản (khoảng 7–8 điểm) trước, rồi mới đến câu khó.</p>
          <p>Web không chạy quảng cáo, không thu thập dữ liệu cá nhân, không cần đăng nhập.</p>

          <h2 style="font-size:1.1rem;margin-top:20px">Nội dung đề thi</h2>
          <p>Chỉ đăng đề chính thức do Sở GD&amp;ĐT các tỉnh công bố, ghi rõ tỉnh, năm và nguồn. Đề mẫu do nhóm tự soạn được ghi rõ “Đề mẫu — không phải đề thật”.</p>
          <p>Lời giải do nhóm biên soạn độc lập, không sao chép từ các trang có bản quyền. Với hình vẽ phức tạp, web dùng hình tự dựng lại hoặc ảnh từ đề gốc khi được phép.</p>

          <h2 style="font-size:1.1rem;margin-top:20px">Lưu ý khi dùng</h2>
          <ul class="formula-list">
            <li>Lời giải có thể còn sai sót. Em hãy kiểm tra lại và hỏi giáo viên nếu thắc mắc.</li>
            <li>Điểm trên web là điểm tự đánh giá, không phải điểm thi chính thức.</li>
            <li>Tiến độ lưu trên máy em. Nếu xoá dữ liệu trình duyệt, tiến độ sẽ mất — hãy xuất file sao lưu định kỳ.</li>
          </ul>
        </div>

        <div class="card card-pad" style="margin-top:14px">
          <h2 style="font-size:1.1rem">Nguồn và ghi công</h2>
          <p class="small muted">Mỗi đề có trường “Nguồn” ở trang giới thiệu đề. Nếu em hoặc thầy cô phát hiện đề/lời giải cần chỉnh, hãy gửi phản hồi qua giáo viên phụ trách.</p>
          <p class="small muted">KaTeX 0.16.11 được dùng để hiển thị công thức, giấy phép MIT.</p>
        </div>
      </div>

      <div>
        <div class="card card-pad" style="background:linear-gradient(120deg,var(--brand-soft),var(--surface) 75%);border-color:transparent">
          <h2 style="font-size:1.05rem">Nguyên tắc dữ liệu</h2>
          <ul class="formula-list small">
            <li>Không cào hàng loạt đề/lời giải từ trang có bản quyền.</li>
            <li>Không tự bịa đề khi tỉnh không công bố.</li>
            <li>Bản nháp nằm ngoài thư mục đăng tải.</li>
            <li>Chưa có giáo viên kiểm duyệt; lời giải có thể sai, hãy kiểm tra và hỏi giáo viên nếu thắc mắc.</li>
          </ul>
        </div>
        <div class="card card-pad" style="margin-top:14px">
          <h2 style="font-size:1.05rem">Thông tin kỹ thuật</h2>
          <table style="width:100%;font-size:.86rem;border-collapse:collapse">
            <tr><td style="padding:5px 0;color:var(--muted)">Nền tảng</td><td>Web tĩnh, HTML/CSS/JS thuần</td></tr>
            <tr><td style="padding:5px 0;color:var(--muted)">Công thức</td><td>KaTeX (đóng gói sẵn)</td></tr>
            <tr><td style="padding:5px 0;color:var(--muted)">Lưu trữ</td><td>localStorage trên máy</td></tr>
            <tr><td style="padding:5px 0;color:var(--muted)">Offline</td><td>Service Worker + PWA</td></tr>
          </table>
        </div>
        <div class="card card-pad" style="margin-top:14px">
          <h2 style="font-size:1.05rem">Liên hệ</h2>
          <p class="small muted">Dự án phi lợi nhuận. Thầy cô muốn góp đề hoặc duyệt nội dung, liên hệ nhóm biên soạn qua trường/lớp phụ trách.</p>
        </div>
      </div>
    </div>`;
}
