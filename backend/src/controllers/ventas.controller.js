const db = require('../config/db');
const { imprimirTicket } = require('../services/printer');

const ventasController = {

    crearVenta: async (req, res) => {
        const {
            metodo_pago,
            total_venta,
            monto_efectivo,
            monto_transferencia,
            monto_tarjeta,
            tipo_tarjeta,
            items,
            imprimir_ticket
        } = req.body;

        const id_usuario = req.user.id;
        const id_sesion = req.id_sesion_activa;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Lista de items inválida" });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            let recargo_porcentaje = 0;
            let recargo_monto = 0;
            let base_total = parseFloat(total_venta);
            
            if (metodo_pago === 'tarjeta') {
                recargo_porcentaje = 8;
                recargo_monto = base_total * 0.08;
            }

            const total_final = base_total + recargo_monto;
            const efectivoFinal = (metodo_pago === 'efectivo' || metodo_pago === 'mixto') ? (monto_efectivo || 0) : 0;
            const transferenciaFinal = (metodo_pago === 'transferencia' || metodo_pago === 'mixto') ? (monto_transferencia || 0) : 0;
            const tarjetaFinal = (metodo_pago === 'tarjeta') ? base_total : 0;

            const [ventaResult] = await connection.query(
                `INSERT INTO ventas 
                (id_usuario, id_sesion, total_venta, total_final,
                monto_efectivo, monto_transferencia, monto_tarjeta,
                metodo_pago, tipo_tarjeta,
                recargo_porcentaje, recargo_monto)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_usuario,
                    id_sesion,
                    base_total,
                    total_final,
                    efectivoFinal,
                    transferenciaFinal,
                    tarjetaFinal,
                    metodo_pago,
                    tipo_tarjeta || null,
                    recargo_porcentaje,
                    recargo_monto
                ]
            );

            const id_venta = ventaResult.insertId;

            for (const item of items) {
                await connection.query(
                    `INSERT INTO detalle_ventas 
                    (id_venta, id_producto, cantidad, precio_unitario, subtotal) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        id_venta,
                        item.id_producto,
                        item.cantidad,
                        item.precio_unitario,
                        item.cantidad * item.precio_unitario
                    ]
                );

                await connection.query(
                    `UPDATE productos 
                     SET stock = stock - ? 
                     WHERE id_producto = ?`,
                    [item.cantidad, item.id_producto]
                );
            }

            await connection.commit();

            if (imprimir_ticket) {
                try {
                    await imprimirTicket({
                        id_venta,
                        total_venta: base_total,
                        total_final,
                        metodo_pago,
                        tipo_tarjeta,
                        recargo_monto,
                        monto_pagado: total_final,
                        items
                    });
                } catch (pErr) {
                    console.error("Error ticket:", pErr);
                }
            }

            res.json({
                message: "Venta registrada",
                id_venta
            });

        } catch (error) {
            await connection.rollback();
            res.status(500).json({
                error: error.message
            });
        } finally {
            connection.release();
        }
    },

    reimprimirUltimo: async (req, res) => {
        try {
            const [ventas] = await db.query(
                `SELECT * 
                 FROM ventas 
                 WHERE id_usuario = ? 
                 ORDER BY id_venta DESC 
                 LIMIT 1`,
                [req.user.id]
            );

            if (ventas.length === 0) {
                return res.status(404).json({
                    error: "No hay ventas para reimprimir"
                });
            }

            const venta = ventas[0];

            const [items] = await db.query(
                `SELECT dv.*, p.nombre 
                 FROM detalle_ventas dv
                 JOIN productos p ON dv.id_producto = p.id_producto
                 WHERE dv.id_venta = ?`,
                [venta.id_venta]
            );

            await imprimirTicket({
                id_venta: venta.id_venta,
                total_venta: venta.total_venta,
                total_final: venta.total_final,
                metodo_pago: venta.metodo_pago,
                tipo_tarjeta: venta.tipo_tarjeta,
                recargo_monto: venta.recargo_monto,
                monto_pagado: venta.total_final,
                items
            });

            res.json({
                message: "Ticket enviado a la impresora"
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Error al reimprimir"
            });
        }
    },

    historialVentas: async (req, res) => {
        try {
            const { desde, hasta, estado } = req.query;

            let filtros = `WHERE 1=1`;
            let params = [];

            if (desde) {
                filtros += ` AND DATE(v.fecha_hora) >= ?`;
                params.push(desde);
            }

            if (hasta) {
                filtros += ` AND DATE(v.fecha_hora) <= ?`;
                params.push(hasta);
            }

            if (estado) {
                filtros += ` AND v.estado = ?`;
                params.push(estado);
            }

            const [rows] = await db.query(
                `SELECT 
                    v.id_venta,
                    v.fecha_hora,
                    u.nombre AS vendedor,
                    v.metodo_pago,
                    v.total_final,
                    v.estado
                FROM ventas v
                JOIN usuarios u ON v.id_usuario = u.id_usuario
                ${filtros}
                ORDER BY v.fecha_hora DESC`,
                params
            );

            res.json(rows);

        } catch (error) {
            res.status(500).json({
                error: "Error al obtener historial",
                details: error.message
            });
        }
    },

    detalleVenta: async (req, res) => {
        const { id } = req.params;

        try {
            const [ventas] = await db.query(
                `SELECT 
                    v.*,
                    u.nombre AS vendedor
                FROM ventas v
                JOIN usuarios u ON v.id_usuario = u.id_usuario
                WHERE v.id_venta = ?`,
                [id]
            );

            if (ventas.length === 0) {
                return res.status(404).json({
                    error: "Venta no encontrada"
                });
            }

            const venta = ventas[0];

            const [items] = await db.query(
                `SELECT 
                    dv.*,
                    p.nombre
                FROM detalle_ventas dv
                JOIN productos p ON dv.id_producto = p.id_producto
                WHERE dv.id_venta = ?`,
                [id]
            );

            res.json({
                venta,
                items
            });

        } catch (error) {
            res.status(500).json({
                error: "Error al obtener detalle",
                details: error.message
            });
        }
    },

    anularVenta: async (req, res) => {
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo || motivo.trim().length < 3) {
            return res.status(400).json({
                error: "Motivo de anulación obligatorio"
            });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [ventas] = await connection.query(
                `SELECT * 
                 FROM ventas 
                 WHERE id_venta = ?`,
                [id]
            );

            if (ventas.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    error: "Venta no encontrada"
                });
            }

            const venta = ventas[0];

            if (venta.estado === 'anulada') {
                await connection.rollback();
                return res.status(400).json({
                    error: "La venta ya fue anulada"
                });
            }

            const [detalles] = await connection.query(
                `SELECT * 
                 FROM detalle_ventas 
                 WHERE id_venta = ?`,
                [id]
            );

            for (const item of detalles) {
                await connection.query(
                    `UPDATE productos
                     SET stock = stock + ?
                     WHERE id_producto = ?`,
                    [item.cantidad, item.id_producto]
                );
            }

            await connection.query(
                `UPDATE ventas
                 SET 
                    estado = 'anulada',
                    motivo_anulacion = ?,
                    fecha_anulacion = NOW(),
                    id_usuario_anulacion = ?
                 WHERE id_venta = ?`,
                [
                    motivo,
                    req.user.id,
                    id
                ]
            );

            await connection.commit();

            res.json({
                message: "Venta anulada correctamente"
            });

        } catch (error) {
            await connection.rollback();

            res.status(500).json({
                error: "Error al anular venta",
                details: error.message
            });

        } finally {
            connection.release();
        }
    }
};

module.exports = ventasController;