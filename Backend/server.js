const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config(); // โหลดค่าจากไฟล์ .env

const app = express();

// Middleware สำหรับอ่านข้อมูล JSON จาก Request Body (เวลาส่งข้อมูลแบบ POST)
app.use(express.json());

// ⚡ 1. ตั้งค่าการเชื่อมต่อ MySQL (Connection Pool)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ฟังก์ชันตรวจสอบว่าเชื่อมต่อฐานข้อมูลสำเร็จไหมตอนเปิด Server
async function checkDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('🐬 MySQL Database connected successfully!');
        connection.release(); // คืนไลฟ์วายให้กับ Pool
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}
checkDatabaseConnection();

// ⚡ 2. สร้าง Routes (API Endpoints)

// หน้าแรกสุด สำหรับเช็คว่า Server รันติดไหม
app.get('/', (req, res) => {
    res.send('Backend Server is running! 🚀');
});

// ดึงข้อมูลทั้งหมดจากตาราง users (GET)
app.get('/api/users', async (req, res) => {
    try {
        // ใช้คำสั่ง SQL ดิบได้เลยตรงนี้ (อย่าลืมเปลี่ยนชื่อตารางให้ตรงกับในฐานข้อมูลของคุณ)
        const [rows] = await pool.query('SELECT * FROM users'); 
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users from database' });
    }
});

// เพิ่มข้อมูลผู้ใช้ใหม่ (POST)
app.post('/api/users', async (req, res) => {
    const { name, email } = req.body; // รับค่าจาก Frontend หรือ Postman
    
    // ตรวจสอบข้อมูลเบื้องต้น
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO users (name, email) VALUES (?, ?)', 
            [name, email]
        );
        res.status(201).json({ 
            message: 'User created successfully!', 
            userId: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to insert user' });
    }
});

// ⚡ 3. สั่งให้ Server ทำงานตาม Port ที่กำหนด
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is floating on http://localhost:${PORT}`);
});