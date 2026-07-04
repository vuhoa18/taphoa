// File: src/app.js

const express = require("express");
const pool = require("./config/database"); // Import cấu hình PostgreSQL đã làm ở bước trước

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình để Server có thể đọc được dữ liệu dạng JSON (rất quan trọng cho API)
app.use(express.json());
const cors = require("cors");
app.use(cors());
app.use(
  cors({
    origin: ["http://taphoadanviet.id.vn", "https://taphoadanviet.id.vn"],
    credentials: true,
  })
);
// -------------------------------------------------------------------------
// ĐƯỜNG DẪN API 1: Lấy toàn bộ danh sách sản phẩm để hiển thị lên Web
// -------------------------------------------------------------------------
app.get("/api/products", async (req, res) => {
  try {
    // Lệnh SQL lấy tất cả sản phẩm, sắp xếp theo ID tăng dần
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");

    // Trả dữ liệu về cho phía Giao diện Web (Frontend)
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------------------
// ĐƯỜNG DẪN API 2: Tìm sản phẩm bằng Mã Vạch (Phục vụ tính năng quét mã tít tít)
// Đường dẫn thực tế sẽ có dạng: /api/products/scan/8934563138164
// -------------------------------------------------------------------------
app.get("/api/products/scan/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params; // Lấy mã vạch người dùng vừa quét truyền lên

    // Tìm kiếm sản phẩm trong PostgreSQL khớp với mã vạch
    const result = await pool.query(
      "SELECT * FROM products WHERE barcode = $1",
      [barcode]
    );

    // Nếu không tìm thấy sản phẩm nào
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm với mã vạch này!",
      });
    }

    // Nếu tìm thấy, trả về thông tin sản phẩm đó
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// Thêm API Thanh toán vào src/app.js

// -------------------------------------------------------------------------
// ĐƯỜNG DẪN API 3: Thanh toán hóa đơn và Trừ kho (Dùng Transaction)
// -------------------------------------------------------------------------
app.post("/api/checkout", async (req, res) => {
  const { items, totalPrice } = req.body; // Giao diện Web sẽ gửi lên danh sách món hàng và tổng tiền

  // Lấy một "nhân viên" từ Hồ bơi kết nối để thực hiện một Giao dịch (Transaction)
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // Bắt đầu khóa an toàn: "All or Nothing"

    // 1. Tạo Hóa đơn mới và lấy ID của hóa đơn đó (RETURNING id)
    const orderResult = await client.query(
      "INSERT INTO orders (total_price) VALUES ($1) RETURNING id",
      [totalPrice]
    );
    const orderId = orderResult.rows[0].id;

    // 2. Lặp qua từng món hàng khách mua để lưu chi tiết và trừ kho
    for (let item of items) {
      // Lưu chi tiết hàng hóa vào hóa đơn
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [orderId, item.id, item.quantity, item.price]
      );

      // Trừ đi số lượng tồn kho trong bảng products
      await client.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2",
        [item.quantity, item.id]
      );
    }

    await client.query("COMMIT"); // Mọi thứ hoàn hảo -> Lưu vĩnh viễn vào Database

    res.json({
      success: true,
      message: "🎉 Thanh toán thành công!",
      orderId: orderId,
    });
  } catch (err) {
    await client.query("ROLLBACK"); // Có lỗi xảy ra -> Hủy bỏ mọi thay đổi để bảo toàn dữ liệu kho
    res
      .status(500)
      .json({ success: false, message: "Lỗi thanh toán: " + err.message });
  } finally {
    client.release(); // Trả "nhân viên" về lại Hồ bơi cho khách khác dùng
  }
});

// =========================================================================
// ĐƯỜNG DẪN API 4: Thêm sản phẩm mới vào kho (Đã nâng cấp)
// =========================================================================
app.post("/api/products", async (req, res) => {
  // Lấy thêm category và is_public từ Web gửi lên
  const { barcode, name, price, stock, category, is_public } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (barcode, name, price, stock, category, is_public) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [barcode, name, price, stock, category, is_public]
    );

    res.json({
      success: true,
      message: "✅ Đã thêm sản phẩm mới vào kho thành công!",
      productId: result.rows[0].id,
    });
  } catch (err) {
    if (err.code === "23505") {
      res
        .status(400)
        .json({ success: false, message: "❌ Lỗi: Mã vạch này đã tồn tại!" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Lỗi máy chủ: " + err.message });
    }
  }
});

// -------------------------------------------------------------------------
// ĐƯỜNG DẪN API 6: Xóa sản phẩm khỏi kho
// -------------------------------------------------------------------------
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params; // Lấy ID của sản phẩm cần xóa từ đường dẫn web

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);

    // Nếu không tìm thấy sản phẩm để xóa (result.rowCount là số dòng bị ảnh hưởng)
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Không tìm thấy sản phẩm này!" });
    }

    res.json({ success: true, message: "🗑️ Đã xóa sản phẩm thành công!" });
  } catch (err) {
    // Mã lỗi 23503 của PostgreSQL nghĩa là: Dữ liệu đang bị dính với bảng khác (Hóa đơn)
    if (err.code === "23503") {
      res.status(400).json({
        success: false,
        message:
          "❌ Không thể xóa! Sản phẩm này đã từng được bán và đang lưu trong Hóa đơn.",
      });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Lỗi máy chủ: " + err.message });
    }
  }
});

// =========================================================================
// ĐƯỜNG DẪN API 7: Đăng nhập (Phiên bản chạy thật trên Render)
// =========================================================================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const bcrypt = require("bcrypt"); // Thư viện kiểm tra mật khẩu đã mã hóa

  try {
    // 1. Tìm tài khoản trong database đám mây
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    // Nếu không tìm thấy tên đăng nhập trong bảng users
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Sai tên đăng nhập hoặc tài khoản không tồn tại!",
        });
    }

    const user = result.rows[0];

    // 2. So sánh mật khẩu người dùng nhập vào với mật khẩu đã băm (hashed) trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Sai mật khẩu!" });
    }

    // 3. Đúng mật khẩu -> Trả về thông tin thành công cho Frontend
    res.json({
      success: true,
      message: "✅ Đăng nhập thành công!",
      user: { fullname: user.fullname, role: user.role },
    });
  } catch (err) {
    // Ghi nhận lỗi chi tiết ra hệ thống log của Render để dễ theo dõi
    console.error("🔥 Lỗi đăng nhập tại hệ thống:", err.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi kết nối cơ sở dữ liệu: " + err.message,
      });
  }
});
// =========================================================================
// ĐƯỜNG DẪN API 5: Xem Báo cáo Doanh thu (Đã bỏ chốt bảo vệ)
// =========================================================================
app.get("/api/reports/revenue", async (req, res) => {
  try {
    const summaryResult = await pool.query(`
        SELECT COUNT(id) AS total_orders, COALESCE(SUM(total_price), 0) AS total_revenue 
        FROM orders
      `);
    const recentOrdersResult = await pool.query(`
        SELECT id, total_price, created_at 
        FROM orders ORDER BY created_at DESC LIMIT 10
      `);

    res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0],
        recentOrders: recentOrdersResult.rows,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi lấy báo cáo: " + err.message });
  }
});

// =========================================================================
// ĐƯỜNG DẪN API 8: Lấy danh sách hàng hóa cho Khách hàng (Public)
// =========================================================================
app.get("/api/public/products", async (req, res) => {
  try {
    // Chỉ lấy những mặt hàng được phép hiển thị (is_public = true) và còn hàng (stock > 0)
    // Sắp xếp theo Danh mục (category) để dễ nhóm trên giao diện
    const result = await pool.query(`
        SELECT id, name, price, category 
        FROM products 
        WHERE is_public = true AND stock > 0 
        ORDER BY category ASC, id DESC
      `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi lấy dữ liệu: " + err.message });
  }
});
// =========================================================================
// ĐƯỜNG DẪN API 9: Bật/Tắt hiển thị sản phẩm trên Web
// =========================================================================
app.put("/api/products/:id/toggle-public", async (req, res) => {
  const { id } = req.params;
  const { is_public } = req.body; // Trạng thái checkbox (true/false) gửi từ web lên

  try {
    await pool.query("UPDATE products SET is_public = $1 WHERE id = $2", [
      is_public,
      id,
    ]);
    res.json({ success: true, message: "Đã cập nhật trạng thái!" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
});
// =========================================================================
// ĐƯỜNG DẪN API 10: Cập nhật (Sửa) thông tin sản phẩm
// =========================================================================
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { barcode, name, price, stock, category } = req.body; // Các thông tin mới

  try {
    await pool.query(
      "UPDATE products SET barcode = $1, name = $2, price = $3, stock = $4, category = $5 WHERE id = $6",
      [barcode, name, price, stock, category, id]
    );
    res.json({ success: true, message: "✅ Cập nhật sản phẩm thành công!" });
  } catch (err) {
    // Bắt lỗi nếu mã vạch mới sửa bị trùng với một món hàng khác đã có
    if (err.code === "23505") {
      res
        .status(400)
        .json({ success: false, message: "❌ Lỗi: Mã vạch này đã bị trùng!" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Lỗi máy chủ: " + err.message });
    }
  }
});
// Khởi động Máy chủ Web
// Sử dụng PORT của hosting cấp, nếu không có thì mới dùng 3000

app.listen(PORT, () => {
  console.log(`Server đang chạy ổn định tại cổng ${PORT}`);
});
