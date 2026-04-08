const db = require('../config/db');

const reportesController = {
    reporteDiarioPorCategoria: async (req, res) => {
        const { fecha } = req.query; 
        
        try {
            const sql = `
                SELECT 
                    c.nombre_categoria, 
                    SUM(dv.subtotal) AS total_vendido,
                    COUNT(DISTINCT v.id_venta) AS cantidad_ventas
                FROM detalle_ventas dv
                JOIN productos p ON dv.id_producto = p.id_producto
                JOIN categorias c ON p.id_categoria = c.id_categoria
                JOIN ventas v ON dv.id_venta = v.id_venta
                WHERE DATE(v.fecha_hora) = ?
                GROUP BY c.id_categoria
                ORDER BY total_vendido DESC
            `;
            
            const [rows] = await db.query(sql, [fecha]);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: "Error al generar reporte", details: error.message });
        }
    }
};

module.exports = reportesController;