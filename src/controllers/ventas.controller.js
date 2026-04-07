const db = require('../config/db');

const ventasController = {
    crearVenta: async (req, res) => {
        const { id_usuario, metodo_pago, total_venta, items } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [ventaResult] = await connection.query(
                'INSERT INTO ventas (id_usuario, total_venta, metodo_pago) VALUES (?, ?, ?)',
                [id_usuario, total_venta, metodo_pago]
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
            res.json({ message: "Venta registrada con éxito", id_venta });

        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: "Error al procesar la venta", details: error.message });
        } finally {
            connection.release();
        }
    }
};

module.exports = ventasController;