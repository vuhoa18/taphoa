const { Pool } = require("pg");

// Khởi tạo Pool kết nối từ chuỗi biến môi trường DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Cấu hình bắt buộc để chấp nhận chứng chỉ tự ký (self-signed) trên Render
  ssl: {
    rejectUnauthorized: false,
  },
});

// Kiểm tra trạng thái kết nối
pool
  .connect()
  .then(() => {
    console.log("🎉 XUẤT SẮC: Backend đã kết nối thành công với Supabase DB!");
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối cơ sở dữ liệu: ", err.message);
  });

module.exports = pool;
