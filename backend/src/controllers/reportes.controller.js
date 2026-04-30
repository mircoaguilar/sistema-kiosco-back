const db = require('../config/db');

const reportesController = {

    reporteProductosDia: async (req, res) => {
        try {
            const { categoria, proveedor, desde, hasta } = req.query;

            let filtrosProductos = `WHERE 1=1`;
            let paramsProductos = [];

            let filtrosVentas = `WHERE 1=1`;
            let paramsVentas = [];

            filtrosVentas += ` AND COALESCE(v.estado, 'activa') = 'activa'`;

            if (desde && hasta) {
                filtrosProductos += ` AND DATE(v.fecha_hora) BETWEEN ? AND ?`;
                filtrosVentas += ` AND DATE(v.fecha_hora) BETWEEN ? AND ?`;
                paramsProductos.push(desde, hasta);
                paramsVentas.push(desde, hasta);
            } else if (desde) {
                filtrosProductos += ` AND DATE(v.fecha_hora) >= ?`;
                filtrosVentas += ` AND DATE(v.fecha_hora) >= ?`;
                paramsProductos.push(desde);
                paramsVentas.push(desde);
            } else if (hasta) {
                filtrosProductos += ` AND DATE(v.fecha_hora) <= ?`;
                filtrosVentas += ` AND DATE(v.fecha_hora) <= ?`;
                paramsProductos.push(hasta);
                paramsVentas.push(hasta);
            } else {
                filtrosProductos += ` AND DATE(v.fecha_hora) = CURDATE()`;
                filtrosVentas += ` AND DATE(v.fecha_hora) = CURDATE()`;
            }

            if (categoria) {
                filtrosProductos += ` AND (p.id_categoria = ? OR dv.id_categoria = ?)`;
                paramsProductos.push(categoria, categoria);
            }

            if (proveedor) {
                filtrosProductos += ` AND p.id_proveedor = ?`;
                paramsProductos.push(proveedor);
            }

            const [rows] = await db.query(`
                SELECT 
                    COALESCE(dv.descripcion_manual, p.nombre) AS nombre,
                    MAX(c.nombre_categoria) AS categoria,
                    COALESCE(MAX(pr.nombre), 'Manual') AS proveedor,
                    SUM(dv.cantidad) AS cantidad,
                    SUM(dv.subtotal) AS total
                FROM detalle_ventas dv
                LEFT JOIN productos p ON dv.id_producto = p.id_producto
                LEFT JOIN categorias c 
                ON c.id_categoria = COALESCE(p.id_categoria, dv.id_categoria)
                LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
                JOIN ventas v ON dv.id_venta = v.id_venta
                AND COALESCE(v.estado, 'activa') = 'activa'
                ${filtrosProductos}
                GROUP BY COALESCE(dv.descripcion_manual, p.nombre)
                ORDER BY total DESC
            `, paramsProductos);

            const totalGeneral = rows.reduce((acc, item) => {
                return acc + parseFloat(item.total);
            }, 0);

            const [ventasCount] = await db.query(`
                SELECT COUNT(*) AS total_ventas
                FROM ventas v
                ${filtrosVentas}
            `, paramsVentas);

            const cantidadVentas = ventasCount[0].total_ventas;

            res.json({
                resumen: {
                    total_dia: totalGeneral,
                    cantidad_ventas: cantidadVentas
                },
                productos: rows
            });

        } catch (error) {
            res.status(500).json({
                error: "Error al generar reporte",
                details: error.message
            });
        }
    },

    topProductos: async (req, res) => {
        try {
            const { desde, hasta, categoria } = req.query;

            let filtros = `WHERE 1=1`;
            let params = [];

            if (desde && hasta) {
                filtros += ` AND DATE(v.fecha_hora) BETWEEN ? AND ?`;
                params.push(desde, hasta);
            } else if (desde) {
                filtros += ` AND DATE(v.fecha_hora) >= ?`;
                params.push(desde);
            } else if (hasta) {
                filtros += ` AND DATE(v.fecha_hora) <= ?`;
                params.push(hasta);
            } else {
                filtros += ` AND DATE(v.fecha_hora) = CURDATE()`;
            }

            if (categoria) {
                filtros += ` AND (p.id_categoria = ? OR dv.id_categoria = ?)`;
                params.push(categoria, categoria);
            }

            const [rows] = await db.query(`
                SELECT 
                    COALESCE(dv.descripcion_manual, p.nombre) AS nombre,
                    SUM(dv.cantidad) AS cantidad
                FROM detalle_ventas dv
                LEFT JOIN productos p ON dv.id_producto = p.id_producto
                JOIN ventas v ON dv.id_venta = v.id_venta
                AND COALESCE(v.estado, 'activa') = 'activa'
                ${filtros}
                GROUP BY COALESCE(dv.descripcion_manual, p.nombre)
                ORDER BY cantidad DESC
                LIMIT 10
            `, params);

            res.json(rows);

        } catch (error) {
            res.status(500).json({
                error: "Error en top productos",
                details: error.message
            });
        }
    }

};

module.exports = reportesController;