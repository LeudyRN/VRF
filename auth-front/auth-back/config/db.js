const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'RLN12345e',
  database: process.env.DB_NAME || 'vrf',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection()
  .then(connection => {
    console.log("Conexión exitosa a la base de datos.");
    connection.release(); // Liberar la conexión inmediatamente
  })
  .catch(error => {
    console.error("Error al conectar a la base de datos:", error.message);
  });

module.exports = pool;