// File: src/config/seed_db.js

const pool = require("./database");

// Khai báo câu lệnh SQL để chèn dữ liệu
// Dùng ON CONFLICT DO NOTHING để tránh lỗi nếu bạn lỡ chạy file này nhiều lần
const insertDataQuery = `
  INSERT INTO products (barcode, name, price, stock)
  VALUES 
    ('8934563138164', 'Mì Hảo Hảo Tôm Chua Cay', 4500, 100),
    ('8934588012112', 'Nước ngọt Coca Cola 320ml', 10000, 50),
    ('8935049501248', 'Sữa tươi Vinamilk 180ml', 8000, 200)
  ON CONFLICT (barcode) DO NOTHING;
`;

async function seedDatabase() {
  try {
    console.log("⏳ Đang thêm dữ liệu mẫu vào kho...");
    // Thực thi câu lệnh chèn dữ liệu
    await pool.query(insertDataQuery);
    console.log("✅ Thêm sản phẩm mẫu thành công! Kho đã có hàng.");
  } catch (err) {
    console.error("❌ Lỗi khi thêm dữ liệu:", err.message);
  } finally {
    // Ngắt kết nối sau khi xong việc
    await pool.end();
  }
}

// Chạy hàm
seedDatabase();
