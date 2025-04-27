const mysql = require('mysql2');
require('dotenv').config();

// Database connection configuration
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
    connectTimeout: 12000
});


console.log("Connecting to database...");

// Function to connect to the database
connection.connect((err) => {
    if (err) {
        console.log('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database successfully!');
});

 // Now, run the CREATE TABLE query after successful connection
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

connection.query(createTableQuery, (err, result) => {
 if (err) {
     console.log('Error creating table:', err);
 } else {
     console.log('Table created successfully');
 }
});

module.exports = connection;
