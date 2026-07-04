const { Pool } = require("pg");
const dns = require("dns");

// Ép Node.js luôn ưu tiên tìm địa chỉ IPv4 trước thay vì IPv6
dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
