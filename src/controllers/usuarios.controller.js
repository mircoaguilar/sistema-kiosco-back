const db = require('../config/db');
const bcrypt = require('bcrypt');

const usuariosController = {
    crearUsuario: async (req, res) => {
        const { nombre_completo, usuario, password, rol } = req.body;

        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            await db.query(
                'INSERT INTO usuarios (nombre_completo, usuario, password, rol) VALUES (?, ?, ?, ?)',
                [nombre_completo, usuario, hashedPassword, rol || 'vendedor']
            );

            res.json({ message: "Usuario creado exitosamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al crear usuario", details: error.message });
        }
    }
};

module.exports = usuariosController;