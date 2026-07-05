const express = require("express");
const pool = require("./config/database");
const cors = require("cors");
const crypto = require("crypto"); // Dùng cho đăng nhập
const app = express();
const PORT = process.env.PORT || 3000;

// CẤU HÌNH MIDDLEWARE (Chỉ gọi 1 lần)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://taphoadanviet.id.vn", "https://taphoadanviet.id.vn"],
    credentials: true,
  })
);

// ==========================================
// NHÓM API: KHÁCH HÀNG (PUBLIC)
// ==========================================

// 1. Lấy danh sách hàng hóa cho Khách hàng (Thêm is_featured)
app.get("/api/public/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, price, category, is_featured 
      FROM products 
      WHERE is_public = true AND stock > 0 
      ORDER BY category ASC, id DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
});

// ==========================================
// NHÓM API: QUẢN LÝ SẢN PHẨM & KHO HÀNG
// ==========================================

// 2. Lấy toàn bộ danh sách sản phẩm (Cho Admin/Thu ngân)
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Tìm sản phẩm bằng Mã Vạch
app.get("/api/products/scan/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;
    const result = await pool.query(
      "SELECT * FROM products WHERE barcode = $1",
      [barcode]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm!" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Thêm sản phẩm mới vào kho
app.post("/api/products", async (req, res) => {
  const { barcode, name, price, stock, category, is_public } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (barcode, name, price, stock, category, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        barcode?.trim() || null,
        name?.trim(),
        Number(price) || 0,
        parseInt(stock, 10) || 0,
        category?.trim() || "Khác",
        is_public ?? true,
      ]
    );
    res
      .status(201)
      .json({
        success: true,
        message: "✅ Đã thêm sản phẩm mới!",
        productId: result.rows[0].id,
      });
  } catch (err) {
    if (err.code === "23505")
      return res
        .status(400)
        .json({ success: false, message: "❌ Lỗi: Mã vạch đã tồn tại!" });
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
});

// 5. Cập nhật thông tin sản phẩm
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { barcode, name, price, stock, category } = req.body;
  try {
    await pool.query(
      "UPDATE products SET barcode = $1, name = $2, price = $3, stock = $4, category = $5 WHERE id = $6",
      [
        barcode?.trim() || null,
        name?.trim(),
        Number(price) || 0,
        parseInt(stock, 10) || 0,
        category?.trim() || "Khác",
        id,
      ]
    );
    res.json({ success: true, message: "✅ Cập nhật sản phẩm thành công!" });
  } catch (err) {
    if (err.code === "23505")
      return res
        .status(400)
        .json({ success: false, message: "❌ Lỗi: Mã vạch bị trùng!" });
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
});

// 6. Xóa sản phẩm
app.delete("/api/products/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm!" });
    res.json({ success: true, message: "🗑️ Đã xóa sản phẩm!" });
  } catch (err) {
    if (err.code === "23503")
      return res
        .status(400)
        .json({
          success: false,
          message: "❌ Không thể xóa vì đã có trong hóa đơn!",
        });
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
});

// 7. Bật/Tắt hiển thị trên Web
app.put("/api/products/:id/toggle-public", async (req, res) => {
  try {
    await pool.query("UPDATE products SET is_public = $1 WHERE id = $2", [
      req.body.is_public,
      req.params.id,
    ]);
    res.json({
      success: true,
      message: "Đã cập nhật trạng thái hiển thị Web!",
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
});

// 8. Bật/Tắt Hàng Nổi Bật (Tươi Mới) - API MỚI
app.put("/api/products/:id/toggle-featured", async (req, res) => {
  try {
    await pool.query("UPDATE products SET is_featured = $1 WHERE id = $2", [
      req.body.is_featured,
      req.params.id,
    ]);
    res.json({ success: true, message: "Đã cập nhật trạng thái nổi bật!" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
});

// ==========================================
// NHÓM API: GIAO DỊCH & BÁO CÁO
// ==========================================

// 9. Thanh toán hóa đơn (Transaction)
app.post("/api/checkout", async (req, res) => {
  const { items, totalPrice } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderResult = await client.query(
      "INSERT INTO orders (total_price) VALUES ($1) RETURNING id",
      [totalPrice]
    );
    const orderId = orderResult.rows[0].id;

    for (let item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [orderId, item.id, item.quantity, item.price]
      );
      await client.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2",
        [item.quantity, item.id]
      );
    }
    await client.query("COMMIT");
    res.json({
      success: true,
      message: "🎉 Thanh toán thành công!",
      orderId: orderId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res
      .status(500)
      .json({ success: false, message: "Lỗi thanh toán: " + err.message });
  } finally {
    client.release();
  }
});

// 10. Báo cáo doanh thu
app.get("/api/reports/revenue", async (req, res) => {
  try {
    const summaryResult = await pool.query(
      "SELECT COUNT(id) AS total_orders, COALESCE(SUM(total_price), 0) AS total_revenue FROM orders"
    );
    const recentOrdersResult = await pool.query(
      "SELECT id, total_price, created_at FROM orders ORDER BY created_at DESC LIMIT 10"
    );
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

// ==========================================
// NHÓM API: ĐĂNG NHẬP (Chỉ giữ lại 1 bản duy nhất, băm SHA256)
// ==========================================

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(401)
        .json({ success: false, message: "Trống thông tin!" });

    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(TRIM(username)) = LOWER($1)",
      [username.trim()]
    );
    if (result.rows.length === 0)
      return res
        .status(401)
        .json({ success: false, message: "Tài khoản không tồn tại." });

    const user = result.rows[0];

    // Hash password nhập vào để so sánh với DB
    const inputHash = crypto
      .createHash("sha256")
      .update(password.trim())
      .digest("hex");

    if (inputHash !== user.password && password.trim() !== user.password) {
      return res
        .status(401)
        .json({ success: false, message: "Mật khẩu không chính xác." });
    }

    return res.json({
      success: true,
      token: "secure-token-tap-hoa",
      user: { fullname: user.fullname, role: user.role },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Lỗi hệ thống: " + err.message });
  }
});

// API Cửa hậu tạo admin chuẩn
app.get("/api/create-admin", async (req, res) => {
  try {
    const newHash = crypto.createHash("sha256").update("123456").digest("hex");
    await pool.query("DELETE FROM users WHERE username = $1", ["admin"]);
    await pool.query(
      "INSERT INTO users (username, password, fullname, role) VALUES ($1, $2, $3, $4)",
      ["admin", newHash, "Chủ Cửa Hàng", "admin"]
    );
    res.send(
      "🎉 Đã tạo lại tài khoản admin! Username: admin | Password: 123456"
    );
  } catch (err) {
    res.status(500).send("Lỗi: " + err.message);
  }
});

// Bật Server
app.listen(PORT, () => {
  console.log(`🚀 Server Backend Tạp Hóa đang chạy cực mượt tại cổng ${PORT}`);
});
