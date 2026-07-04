const { Pool } = require("pg");

// Tách chuỗi URL ra thành các thông số cấu hình độc lập để tránh lỗi bóc tách ký tự
const pool = new Pool({
  user: "postgres.ypahdompmcoxoryivfmk",
  password: "Hoangvuhoa1808",
  host: "aws-0-ap-southeast-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  ssl: {
    rejectUnauthorized: false, // Bỏ qua lỗi self-signed certificate
  },
});

pool
  .connect()
  .then(() =>
    console.log(
      "🎉 XUẤT SẮC: Backend đã kết nối thành công với Supabase DB bằng cấu hình Object!"
    )
  )
  .catch((err) => console.error("❌ Lỗi kết nối cơ sở dữ liệu: ", err.message));

module.exports = pool;
