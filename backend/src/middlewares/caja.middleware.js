const db = require('../config/db');

const verificarCajaAbierta = async (req, res, next) => {
    const id_usuario = req.user.id; 

    try {
        const [rows] = await db.query(
            "SELECT id_sesion FROM sesiones_caja WHERE id_usuario = ? AND estado = 'abierta'",
            [id_usuario]
        );

        if (rows.length === 0) {
            return res.status(403).json({ 
                error: "Acceso denegado. No hay una sesión de caja abierta para este usuario." 
            });
        }

        req.id_sesion_activa = rows[0].id_sesion;
        
        next();
    } catch (error) {
        return res.status(500).json({ 
            error: "Error interno al verificar el estado de la caja.",
            details: error.message 
        });
    }
};

module.exports = { verificarCajaAbierta };