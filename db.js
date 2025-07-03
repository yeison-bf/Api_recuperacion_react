// db.js
const mysql = require("mysql2");

// Configura tu conexión aquí:
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "yeison",      // tu contraseña si tienes
  database: "servicios_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
