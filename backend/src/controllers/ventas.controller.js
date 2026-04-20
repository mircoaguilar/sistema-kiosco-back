const db = require('../config/db');
const { imprimirTicket } = require('../services/printer');

const ventasController = {
    crearVenta: async (req, res) => {
        const { 
            metodo_pago, 
            total_venta, 
            monto_efectivo, 
            monto_transferencia, 
            monto_pagado,
            items,
            imprimir_ticket
        } = req.body;

        const id_usuario = req.user.id; 
        const id_sesion = req.id_sesion_activa; 

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: "La lista de productos ('items') es inválida o no existe." });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [ventaResult] = await connection.query(
                `INSERT INTO ventas 
                (id_usuario, id_sesion, total_venta, monto_efectivo, monto_transferencia, metodo_pago, monto_pagado) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_usuario, 
                    id_sesion,
                    total_venta, 
                    monto_efectivo || 0, 
                    monto_transferencia || 0, 
                    metodo_pago,
                    monto_pagado || total_venta
                ]
            );
            
            const id_venta = ventaResult.insertId;

            for (const item of items) {
                await connection.query(
                    'INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [id_venta, item.id_producto, item.cantidad, item.precio_unitario, (item.cantidad * item.precio_unitario)]
                );

                await connection.query(
                    'UPDATE productos SET stock = stock - ? WHERE id_producto = ?',
                    [item.cantidad, item.id_producto]
                );
            }

            await connection.commit();

            if (imprimir_ticket) {
                await imprimirTicket({
                    id_venta,
                    total_venta,
                    metodo_pago,
                    monto_pagado,
                    items
                });
            }

            res.json({ message: "Venta registrada con éxito", id_venta });

        } catch (error) {
            await connection.rollback();
            console.error("Error en DB:", error);
            res.status(500).json({ error: "Error al procesar la venta", details: error.message });
        } finally {
            connection.release();
        }
    },

    reimprimirUltimo: async (req, res) => {
        try {
            const [venta] = await db.query(`
                SELECT * FROM ventas 
                ORDER BY id_venta DESC 
                LIMIT 1
            `);

            if (venta.length === 0) {
                return res.status(404).json({ error: "No hay ventas" });
            }

            const id_venta = venta[0].id_venta;

            const [items] = await db.query(`
                SELECT dv.cantidad, dv.precio_unitario, p.nombre
                FROM detalle_ventas dv
                JOIN productos p ON dv.id_producto = p.id_producto
                WHERE dv.id_venta = ?
            `, [id_venta]);

            await imprimirTicket({
                id_venta,
                total_venta: venta[0].total_venta,
                metodo_pago: venta[0].metodo_pago,
                monto_pagado: venta[0].monto_pagado,
                items
            });

            res.json({ message: "Ticket reimpreso" });

        } catch (error) {
            res.status(500).json({ error: "Error al reimprimir" });
        }
    }
};

module.exports = ventasController;