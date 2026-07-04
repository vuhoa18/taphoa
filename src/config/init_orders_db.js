// File: src/config/init_orders_db.js

const pool = require("./database");

const createOrdersTables = `
  -- Bảng lưu thông tin chung của Hóa Đơn
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Bảng lưu chi tiết từng món hàng thuộc Hóa Đơn nào
  CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),     -- Liên kết với hóa đơn
    product_id INT REFERENCES products(id), -- Liên kết với sản phẩm
    quantity INT NOT NULL,                  -- Số lượng mua
    price NUMERIC(12, 2) NOT NULL           -- Giá tại thời điểm mua (đề phòng sau này đổi giá)
  );
`;

async function initOrders() {
  try {
    await pool.query(createOrdersTables);
    console.log(
      "✅ Đã tạo bảng Hóa Đơn (orders) và Chi Tiết Hóa Đơn (order_items) thành công!"
    );
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await pool.end();
  }
}

initOrders();
