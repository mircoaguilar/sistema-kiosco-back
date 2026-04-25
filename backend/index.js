require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

if (!process.env.JWT_SECRET) {
    console.error("ERROR CRÍTICO: No se encontró la JWT_SECRET.");
    process.exit(1);
}

const app = express();

// ======================
// CORS CONFIG (CORRECTO)
// ======================
const corsOptions = {
    origin: [
        'https://sistema-kiosco-web.onrender.com',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions)); // 👈 ÚNICO CORS NECESARIO

// ======================
// MIDDLEWARE BASE
// ======================
app.use(express.json());

// ======================
// ROUTES
// ======================
app.use('/api/productos', require('./src/routes/productos.routes'));
app.use('/api/ventas', require('./src/routes/ventas.routes'));
app.use('/api/caja', require('./src/routes/caja.routes'));
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/movimientos', require('./src/routes/movimientos.routes'));
app.use('/api/categorias', require('./src/routes/categorias.routes'));
app.use('/api/proveedores', require('./src/routes/proveedores.routes'));
app.use('/api/reportes', require('./src/routes/reportes.routes'));

// ======================
// TEST DB
// ======================
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ message: "Conexión exitosa", result: rows });
    } catch (error) {
        res.status(500).json({ error: "Error en DB", details: error.message });
    }
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
    console.log(`Seguridad activa y Base de Datos conectada`);
});