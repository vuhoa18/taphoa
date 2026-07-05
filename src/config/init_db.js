const pool = require("./database");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    category VARCHAR(100) DEFAULT 'Khác',
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false
  );
`;

async function initDatabase() {
  try {
    // 1. Tạo bảng nếu chưa có
    await pool.query(createTableQuery);
    console.log('🎉 Đã kiểm tra/tạo bảng "products" thành công!');

    // 2. Tự động thêm các cột mới nếu bảng cũ chưa có (bỏ qua lỗi nếu cột đã tồn tại)
    const columnsToAdd = [
      "ALTER TABLE products ADD COLUMN category VARCHAR(100) DEFAULT 'Khác';",
      "ALTER TABLE products ADD COLUMN is_public BOOLEAN DEFAULT true;",
      "ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT false;",
    ];

    for (let query of columnsToAdd) {
      try {
        await pool.query(query);
        console.log(`✅ Đã cập nhật thêm cột mới vào Database.`);
      } catch (e) {
        // Bỏ qua lỗi nếu cột đã tồn tại
      }
    }

    console.log("✨ Cơ sở dữ liệu đã sẵn sàng cho tính năng Mới!");
  } catch (err) {
    console.error("❌ Lỗi khi khởi tạo CSDL:", err.message);
  } finally {
    await pool.end();
    console.log("🔌 Đã ngắt kết nối an toàn.");
  }
}

initDatabase();
