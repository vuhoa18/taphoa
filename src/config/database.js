const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Thêm đoạn cấu hình ssl dưới đây để chạy được trên Render
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then(() =>
    console.log("🎉 Đã kết nối thành công với PostgreSQL trên Supabase!")
  )
  .catch((err) => console.error("❌ Lỗi kết nối cơ sở dữ liệu: ", err.message));

module.exports = pool;
