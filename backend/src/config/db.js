const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '-03:00',
    port: process.env.DB_PORT, // Asegúrate de tener esta variable en Render
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // <--- ESTO ES LO QUE FALTA PARA AIVEN
    }
});

module.exports = pool.promise();