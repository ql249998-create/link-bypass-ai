LINK BYPASS AI — BẢN API

Tệp:
- index.html : giao diện website neon, chạy trên điện thoại.
- server.js  : API Node.js để thử theo các redirect HTTP.

Cách chạy API trên máy có Node.js 20+:
1. Tạo thư mục mới, lưu server.js vào đó.
2. Chạy: npm init -y
3. Chạy: npm install express
4. Chạy: node server.js
5. API endpoint là http://localhost:3000/resolve (chỉ dùng thử trên cùng máy).

Để website trên điện thoại truy cập API từ internet:
- Triển khai server.js lên dịch vụ hosting Node.js có HTTPS.
- Trong index.html, nhập endpoint HTTPS đầy đủ, ví dụ https://ten-mien-cua-ban/resolve.
- Nếu website HTML và API khác origin, cần cấu hình CORS cho đúng origin trong backend (không mở * tùy tiện).
- Không để API công khai không giới hạn; hãy thêm rate limit, logging tối thiểu và bảo vệ chống lạm dụng.

Giới hạn:
- Nhiều website không hỗ trợ HEAD hoặc yêu cầu JavaScript/cookie; API có thể không lấy được đích.
- Không dùng để vượt đăng nhập, CAPTCHA, paywall hoặc cơ chế bảo vệ.
- Ví dụ server có kiểm tra IP cơ bản nhưng không thay thế đánh giá bảo mật production; cần thêm bảo vệ DNS rebinding/SSRF, rate limit và kiểm thử trước khi public.
