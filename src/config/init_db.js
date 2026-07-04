

// Import lại cấu hình pool mà bạn vừa kết nối thành công ở lượt trước
const pool = require('./database');

// Câu lệnh SQL để tạo bảng sản phẩm
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL, -- Lưu mã vạch 1D/2D, không được trùng lặp
    name VARCHAR(255) NOT NULL,          -- Tên sản phẩm (Ví dụ: Mì Hảo Hảo chua cay)
    price NUMERIC(12, 2) NOT NULL,       -- Giá bán (Dùng NUMERIC để tính tiền chính xác tuyệt đối)
    stock INT NOT NULL DEFAULT 0         -- Số lượng tồn kho (Mặc định ban đầu là 0)
  );
`;

async function initDatabase() {
  try {
    // Gửi câu lệnh SQL sang PostgreSQL để thực thi
    await pool.query(createTableQuery);
    console.log('🎉 Tuyệt vời! Đã tạo bảng "products" thành công trong cơ sở dữ liệu!');
  } catch (err) {
    console.error('❌ Lỗi khi tạo bảng:', err.message);
  } finally {
    // Đóng hồ bơi kết nối sau khi đã hoàn thành tác vụ
    await pool.end();
    console.log('🔌 Đã ngắt kết nối an toàn.');
  }
}

// Chạy hàm khởi tạo
initDatabase();