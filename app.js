// index.js
const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Crear tablas automáticamente al iniciar
(async () => {
    try {
        await db.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        identificacion VARCHAR(50) NOT NULL,
        nombres VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        telefono VARCHAR(20),
        direccion VARCHAR(200),
        password VARCHAR(100) NOT NULL,
        sexo ENUM('M', 'F'),
        edad INT,
        estatus ENUM('activo', 'inactivo'),
        role_id INT,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                categoria VARCHAR(100),
                precio_compra DECIMAL(10,2),
                precio_venta DECIMAL(10,2),
                iva DECIMAL(5,2),
                imagen_url VARCHAR(255)
            )
        `);

        console.log("✅ Tablas listas.");
    } catch (error) {
        console.error("Error creando tablas:", error);
    }
})();

/* Rutas */

// Crear Rol
app.post("/api/roles", async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "El nombre es requerido." });

    try {
        const [result] = await db.query("INSERT INTO roles (name) VALUES (?)", [name]);
        res.json({ success: true, data: { id: result.insertId, name } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error al crear rol." });
    }
});

// Crear Usuario
app.post("/api/users", async (req, res) => {
    const { identificacion, nombres, apellidos, email, telefono, direccion, password, sexo, edad, estatus, role_id } = req.body;

    if (!identificacion || !nombres || !apellidos || !email || !password) {
        return res.status(400).json({ success: false, message: "Los campos obligatorios son: identificacion, nombres, apellidos, email y password." });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO users 
      (identificacion, nombres, apellidos, email, telefono, direccion, password, sexo, edad, estatus, role_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [identificacion, nombres, apellidos, email, telefono, direccion, password, sexo, edad, estatus, role_id]
        );

        res.json({ success: true, data: { id: result.insertId, identificacion, nombres, apellidos, email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error al crear usuario." });
    }
});

// Crear Producto
// Crear Producto
app.post("/api/productos", async (req, res) => {
    const { name, categoria, precio_compra, precio_venta, iva, imagen_url } = req.body;

    if (!name || precio_compra == null || precio_venta == null || iva == null) {
        return res.status(400).json({
            success: false,
            message: "Los campos obligatorios son: name, precio_compra, precio_venta e iva."
        });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO productos (name, categoria, precio_compra, precio_venta, iva, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [name, categoria, precio_compra, precio_venta, iva, imagen_url]
        );

        res.json({
            success: true,
            data: {
                id: result.insertId,
                name,
                categoria,
                precio_compra,
                precio_venta,
                iva,
                imagen_url
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error al crear producto." });
    }
});

// Login de usuario por email y password (sin encriptar)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "El correo y la contraseña son obligatorios."
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE email = ? AND password = ?`,
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas."
      });
    }

    // Si todo OK, devolvemos el usuario (sin la password si quieres)
    const user = rows[0];
    delete user.password; // opcional: quitarla de la respuesta

    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error en el servidor."
    });
  }
});




// Obtener todos los roles
app.get("/api/roles", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM roles`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener roles." });
  }
});


// Obtener todos los usuarios
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM users`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener usuarios." });
  }
});


// Obtener todos los productos
app.get("/api/productos", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM productos`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener productos." });
  }
});




// Ruta base
app.get("/", (req, res) => {
    res.send("API de Roles, Usuarios y Productos conectada a MySQL.");
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
