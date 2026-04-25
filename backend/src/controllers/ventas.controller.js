const db = require('../config/db');
const { imprimirTicket } = require('../services/printer');

const ventasController = {
    // --- FUNCIÓN 1: CREAR VENTA (La que actualizamos antes) ---
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
                [id_usuario, id_sesion, base_total, total_final, efectivoFinal, transferenciaFinal, tarjetaFinal, metodo_pago, tipo_tarjeta || null, recargo_porcentaje, recargo_monto]
            );

            const id_venta = ventaResult.insertId;

            for (const item of items) {
                await connection.query(
                    `INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`,
                    [id_venta, item.id_producto, item.cantidad, item.precio_unitario, item.cantidad * item.precio_unitario]
                );
                await connection.query(`UPDATE productos SET stock = stock - ? WHERE id_producto = ?`, [item.cantidad, item.id_producto]);
            }

            await connection.commit();

            if (imprimir_ticket) {
                try {
                    await imprimirTicket({ id_venta, total_venta: base_total, total_final, metodo_pago, tipo_tarjeta, recargo_monto, monto_pagado: total_final, items });
                } catch (pErr) { console.error("Error ticket:", pErr); }
            }

            res.json({ message: "Venta registrada", id_venta });

        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: error.message });
        } finally {
            connection.release();
        }
    },

    // --- FUNCIÓN 2: REIMPRIMIR (Esta es la que te faltaba y causaba el crash) ---
    reimprimirUltimo: async (req, res) => {
        try {
            // Buscamos la última venta del usuario actual
            const [ventas] = await db.query(
                `SELECT * FROM ventas WHERE id_usuario = ? ORDER BY id_venta DESC LIMIT 1`,
                [req.user.id]
            );

            if (ventas.length === 0) {
                return res.status(404).json({ error: "No hay ventas para reimprimir" });
            }

            const venta = ventas[0];

            // Buscamos los items de esa venta
            const [items] = await db.query(
                `SELECT dv.*, p.nombre 
                 FROM detalle_ventas dv 
                 JOIN productos p ON dv.id_producto = p.id_producto 
                 WHERE dv.id_venta = ?`,
                [venta.id_venta]
            );

            // Llamamos al servicio de impresión
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

            res.json({ message: "Ticket enviado a la impresora" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al reimprimir" });
        }
    }
};

module.exports = ventasController;