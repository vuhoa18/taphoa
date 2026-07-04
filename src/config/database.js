// File: src/config/database.js

// Import thư viện 'pg' mà chúng ta vừa cài đặt
const { Pool } = require('pg');

// Khởi tạo một "Hồ bơi" (Pool) chứa các kết nối tới PostgreSQL
const pool = new Pool({
  user: 'postgres',        // Tên đăng nhập mặc định của PostgreSQL
  host: 'localhost',       // Địa chỉ máy chủ (đang chạy trên chính máy cá nhân của bạn)
  database: 'taphoa_db',   // Tên cơ sở dữ liệu (chúng ta sẽ tạo sau)
  password: 'mật_khẩu',    // Thay bằng mật khẩu bạn đã đặt lúc cài PostgreSQL
  port: 5432,              // Cổng giao tiếp mặc định của PostgreSQL
});

// Chạy thử kết nối để xem có thành công hay không
pool.connect()
  .then(() => console.log('🎉 Tuyệt vời! Đã kết nối thành công với PostgreSQL!'))
  .catch((err) => console.error('❌ Lỗi kết nối cơ sở dữ liệu:', err.message));

// Xuất cấu hình này ra để các file khác (ví dụ: phần xử lý hàng hóa) có thể sử dụng
module.exports = pool;