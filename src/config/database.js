const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Thêm dòng dưới đây để chấp nhận các chứng chỉ tự ký (self-signed) từ Supabase pooler
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
