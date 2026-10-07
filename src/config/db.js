import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool to the MySQL database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // We omit DB_NAME initially so we can create it if it doesn't exist yet
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ Connected to MySQL Server at: ${process.env.DB_HOST}`);
    
    // 1. Create the database if it doesn't exist
    const dbName = process.env.DB_NAME || 'vyraconnect';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Database \`${dbName}\` is ready.`);
    
    // 2. Select the database
    await connection.query(`USE \`${dbName}\`;`);
    
    // 3. Create a sample 'admins' table automatically for your admin side
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`✅ Admin table is ready.`);

    // Update the pool to use the selected database for future queries
    pool.pool.config.database = dbName;
    
    connection.release();
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

export { pool };
export default connectDB;
