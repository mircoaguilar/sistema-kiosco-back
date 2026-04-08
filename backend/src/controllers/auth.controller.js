const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
    login: async (req, res) => {
        const { usuario, password } = req.body;

        try {
            const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ? AND estado = 1', [usuario]);
            
            if (rows.length === 0) {
                return res.status(401).json({ message: "Credenciales inválidas" });
            }

            const user = rows[0];

            const match = await bcrypt.compare(password, user.password);
            
            if (!match) {
                return res.status(401).json({ message: "Credenciales inválidas" });
            }

            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET no definida en variables de entorno");
            }

            const token = jwt.sign(
                { 
                    id: user.id_usuario, 
                    rol: user.rol, 
                    nombre: user.nombre_completo,
                    username: user.usuario 
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' } 
            );

            res.json({
                message: "Login exitoso",
                token,
                user: { 
                    id: user.id_usuario,
                    nombre: user.nombre_completo, 
                    rol: user.rol 
                }
            });

        } catch (error) {
            console.error(error); 
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
};

module.exports = authController;