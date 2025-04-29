const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  try {
    console.log("Connecting to database...");

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: false,
      connectTimeout: 12000
    });

    console.log("Connected to database successfully!");

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user (
        userId INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        dob DATE,
        gender VARCHAR(10),
        role VARCHAR(10),
        skills TEXT,
        interests TEXT,
        bio TEXT,
        profileImageUrl VARCHAR(255)
      ) ENGINE = InnoDB;
    `;

    await connection.query(createTableQuery);
    console.log("Table created successfully");

    return connection;
  } catch (err) {
    console.error("Database connection/setup error:", err);
  }
}

module.exports = initDB;
