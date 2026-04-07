const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
    login: async (req, res) => {
        const { usuario, password } = req.body;

        try {
            const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ? AND estado = 1', [usuario]);
            
            if (rows.length === 0) {
                return res.status(401).json({ message: "Usuario no encontrado o inactivo" });
            }

            const user = rows[0];

            if (password !== user.password) { 
                return res.status(401).json({ message: "Contraseña incorrecta" });
            }

            const token = jwt.sign(
                { id: user.id_usuario, rol: user.rol, nombre: user.nombre_completo },
                process.env.JWT_SECRET || 'clave_secreta_provisoria',
                { expiresIn: '8h' } 
            );

            res.json({
                message: "Login exitoso",
                token,
                user: { nombre: user.nombre_completo, rol: user.rol }
            });

        } catch (error) {
            res.status(500).json({ error: "Error en el servidor", details: error.message });
        }
    }
};

module.exports = authController;