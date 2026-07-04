// Gọi thư viện kết nối PostgreSQL client
const { Pool } = require("pg");

// Khởi tạo Pool chứa toàn bộ thông số cấu hình lấy từ ảnh màn hình Supabase thực tế
const pool = new Pool({
  user: "postgres.ypahdompmcoxoryivfmk", // Mục user trong ảnh
  password: "Hoangvuhoa1808", // Mật khẩu mới không chứa ký tự đặc biệt của bạn
  host: "aws-1-ap-south-1.pooler.supabase.com", // Mục host chính xác từ ảnh của bạn
  port: 6543, // Mục port trong ảnh
  database: "postgres", // Mục database trong ảnh
  ssl: {
    rejectUnauthorized: false, // Cho phép bỏ qua xác thực chuỗi chứng chỉ tự ký trên Render
  },
});

// Chạy thử hàm kích hoạt kết nối khi khởi động ứng dụng Backend
pool
  .connect()
  .then(() => {
    console.log(
      "🎉 XUẤT SẮC: Hệ thống đã kết nối thành công tới Supabase qua máy chủ aws-1!"
    );
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối cơ sở dữ liệu: ", err.message);
  });

// Xuất biến pool để phân phối cho các tệp tin xử lý API khác sử dụng
module.exports = pool;
