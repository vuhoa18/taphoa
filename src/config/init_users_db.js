// File: src/config/init_users_db.js

const pool = require('./database');
const bcrypt = require('bcrypt'); // Thư viện băm mật khẩu

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'cashier'
  );
`;

async function initUsers() {
  try {
    // 1. Tạo bảng users
    await pool.query(createUsersTable);
    console.log('✅ Đã tạo bảng users (Tài khoản) thành công!');

    // 2. Mã hóa mật khẩu '123456' để đảm bảo an toàn
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('123456', saltRounds);

    // 3. Chèn 2 tài khoản mẫu vào bảng
    const insertQuery = `
      INSERT INTO users (username, password, fullname, role) 
      VALUES 
        ('hoadangcap', $1, 'Hoàng Vũ Hoà', 'admin'),
        ('nv1', $2, 'haha', 'cashier')
      ON CONFLICT (username) DO NOTHING;
    `;
    
    // Dùng chung 1 mật khẩu đã mã hóa cho cả 2 tài khoản
    await pool.query(insertQuery, [hashedPassword, hashedPassword]);
    console.log('✅ Đã tạo 2 tài khoản mẫu thành công! (Mật khẩu đều là: 123456)');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await pool.end();
  }
}

initUsers();