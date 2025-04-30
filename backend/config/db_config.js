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


    const createMentorshipRequestsTableQuery = `
    CREATE TABLE IF NOT EXISTS mentorship_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      from_user INT,
      to_user INT,
      status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
      rejected_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user) REFERENCES user(userId)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
      FOREIGN KEY (to_user) REFERENCES user(userId)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
    ) ENGINE = InnoDB;
  `;


    await connection.query(createTableQuery);
    await connection.query(createMentorshipRequestsTableQuery);
    console.log("Table created successfully");

    return connection;
  } catch (err) {
    console.error("Database connection/setup error:", err);
  }
}

module.exports = initDB;
