const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Bắt buộc phải có dòng này khi chạy trên Render
  },
});

pool
  .connect()
  .then(() =>
    console.log("🎉 Đã kết nối thành công với PostgreSQL trên Supabase!")
  )
  .catch((err) => console.error("❌ Lỗi kết nối cơ sở dữ liệu: ", err.message));

module.exports = pool;
