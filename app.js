// app.js
const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Roles, Usuarios y Productos',
      version: '1.0.0',
      description: 'API para gestión de roles, usuarios y productos con MySQL',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desarrollo',
      },
    ],
  },
  apis: ['./app.js'], // Cambiado a app.js
};

const specs = swaggerJsdoc(swaggerOptions);

// Ruta para servir la documentación de Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del rol
 *         name:
 *           type: string
 *           description: Nombre del rol
 *       example:
 *         id: 1
 *         name: "Administrador"
 *     User:
 *       type: object
 *       required:
 *         - identificacion
 *         - nombres
 *         - apellidos
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del usuario
 *         identificacion:
 *           type: string
 *           description: Número de identificación
 *         nombres:
 *           type: string
 *           description: Nombres del usuario
 *         apellidos:
 *           type: string
 *           description: Apellidos del usuario
 *         email:
 *           type: string
 *           description: Email del usuario
 *         telefono:
 *           type: string
 *           description: Teléfono del usuario
 *         direccion:
 *           type: string
 *           description: Dirección del usuario
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *         sexo:
 *           type: string
 *           enum: [M, F]
 *           description: Sexo del usuario
 *         edad:
 *           type: integer
 *           description: Edad del usuario
 *         estatus:
 *           type: string
 *           enum: [activo, inactivo]
 *           description: Estado del usuario
 *         role_id:
 *           type: integer
 *           description: ID del rol asignado
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - precio_compra
 *         - precio_venta
 *         - iva
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del producto
 *         name:
 *           type: string
 *           description: Nombre del producto
 *         categoria:
 *           type: string
 *           description: Categoría del producto
 *         precio_compra:
 *           type: number
 *           format: float
 *           description: Precio de compra
 *         precio_venta:
 *           type: number
 *           format: float
 *           description: Precio de venta
 *         iva:
 *           type: number
 *           format: float
 *           description: Porcentaje de IVA
 *         imagen_url:
 *           type: string
 *           description: URL de la imagen del producto
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 */

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crear un nuevo rol
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del rol
 *             example:
 *               name: "Administrador"
 *     responses:
 *       200:
 *         description: Rol creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
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

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
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

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
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

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *             example:
 *               email: "usuario@ejemplo.com"
 *               password: "123456"
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Datos faltantes
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error del servidor
 */
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

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtener todos los roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *       500:
 *         description: Error del servidor
 */
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

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: Error del servidor
 */
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

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error del servidor
 */
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

// ==================== MÉTODOS DELETE ====================

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Eliminar un rol
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del rol a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rol eliminado exitosamente
 *       400:
 *         description: ID inválido o rol tiene usuarios asociados
 *       404:
 *         description: Rol no encontrado
 *       500:
 *         description: Error del servidor
 */
// Eliminar Rol
app.delete("/api/roles/:id", async (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un número válido
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "ID inválido. Debe ser un número."
    });
  }

  try {
    // Verificar si el rol existe
    const [roleExists] = await db.query("SELECT id FROM roles WHERE id = ?", [id]);
    if (roleExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "El rol no existe."
      });
    }

    // Verificar si hay usuarios asociados a este rol
    const [usersWithRole] = await db.query("SELECT COUNT(*) as count FROM users WHERE role_id = ?", [id]);
    if (usersWithRole[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el rol porque tiene ${usersWithRole[0].count} usuario(s) asociado(s). Primero cambie o elimine los usuarios asociados.`
      });
    }

    // Eliminar el rol
    const [result] = await db.query("DELETE FROM roles WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se pudo eliminar el rol."
      });
    }

    res.json({
      success: true,
      message: "Rol eliminado exitosamente."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el rol."
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
// Eliminar Usuario
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un número válido
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "ID inválido. Debe ser un número."
    });
  }

  try {
    // Verificar si el usuario existe
    const [userExists] = await db.query("SELECT id, nombres, apellidos FROM users WHERE id = ?", [id]);
    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "El usuario no existe."
      });
    }

    // Eliminar el usuario
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se pudo eliminar el usuario."
      });
    }

    res.json({
      success: true,
      message: `Usuario ${userExists[0].nombres} ${userExists[0].apellidos} eliminado exitosamente.`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el usuario."
    });
  }
});

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
// Eliminar Producto
app.delete("/api/productos/:id", async (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un número válido
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "ID inválido. Debe ser un número."
    });
  }

  try {
    // Verificar si el producto existe
    const [productExists] = await db.query("SELECT id, name FROM productos WHERE id = ?", [id]);
    if (productExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "El producto no existe."
      });
    }

    // Eliminar el producto
    const [result] = await db.query("DELETE FROM productos WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se pudo eliminar el producto."
      });
    }

    res.json({
      success: true,
      message: `Producto "${productExists[0].name}" eliminado exitosamente.`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el producto."
    });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Ruta base de la API
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Mensaje de bienvenida
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "API de Roles, Usuarios y Productos conectada a MySQL."
 */
// Ruta base
app.get("/", (req, res) => {
    res.send("API de Roles, Usuarios y Productos conectada a MySQL.");
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada"
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    console.log(`📚 Documentación disponible en http://localhost:${PORT}/api-docs`);
});