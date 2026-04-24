const db = require('../config/db');

const productosController = {

    obtenerTodos: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT 
                    p.*, 
                    c.nombre_categoria,
                    pr.nombre AS nombre_proveedor
                FROM productos p 
                LEFT JOIN categorias c ON p.id_categoria = c.id_categoria 
                LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
                WHERE p.activo = 1
                ORDER BY p.nombre ASC
            `);

            res.json(rows);

        } catch (error) {
            res.status(500).json({ 
                error: "Error al obtener productos", 
                details: error.message 
            });
        }
    },

    obtenerPorCodigo: async (req, res) => {
        const { codigo } = req.params;

        try {
            const [rows] = await db.query(`
                SELECT 
                    p.*, 
                    c.nombre_categoria,
                    pr.nombre AS nombre_proveedor
                FROM productos p
                LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
                LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
                WHERE p.codigo_barras = ?
            `, [codigo]);

            if (rows.length === 0) {
                return res.status(404).json({ 
                    message: "Producto no encontrado" 
                });
            }

            res.json(rows[0]);

        } catch (error) {
            res.status(500).json({ 
                error: "Error al buscar producto", 
                details: error.message 
            });
        }
    },

    crear: async (req, res) => {
        const { 
            codigo_barras, 
            nombre, 
            id_categoria, 
            id_proveedor,
            precio_costo, 
            precio_venta, 
            stock, 
            stock_minimo 
        } = req.body;

        try {
            // Validar proveedor si viene
            if (id_proveedor) {
                const [prov] = await db.query(
                    'SELECT id_proveedor FROM proveedores WHERE id_proveedor = ? AND activo = 1',
                    [id_proveedor]
                );

                if (prov.length === 0) {
                    return res.status(400).json({ 
                        error: "Proveedor inválido" 
                    });
                }
            }

            const sql = `
                INSERT INTO productos 
                (codigo_barras, nombre, id_categoria, id_proveedor, precio_costo, precio_venta, stock, stock_minimo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.query(sql, [
                codigo_barras,
                nombre,
                id_categoria,
                id_proveedor || null,
                precio_costo,
                precio_venta,
                stock,
                stock_minimo
            ]);

            res.json({ 
                message: "Producto creado con éxito", 
                id: result.insertId 
            });

        } catch (error) {
            res.status(500).json({ 
                error: "Error al crear producto", 
                details: error.message 
            });
        }
    },

    actualizar: async (req, res) => {
        const { id } = req.params;

        const { 
            nombre, 
            id_categoria, 
            id_proveedor,
            precio_costo, 
            precio_venta, 
            stock, 
            stock_minimo 
        } = req.body;

        try {
            // Validar proveedor si viene
            if (id_proveedor) {
                const [prov] = await db.query(
                    'SELECT id_proveedor FROM proveedores WHERE id_proveedor = ? AND activo = 1',
                    [id_proveedor]
                );

                if (prov.length === 0) {
                    return res.status(400).json({ 
                        error: "Proveedor inválido" 
                    });
                }
            }

            const sql = `
                UPDATE productos 
                SET 
                    nombre = ?, 
                    id_categoria = ?, 
                    id_proveedor = ?, 
                    precio_costo = ?, 
                    precio_venta = ?, 
                    stock = ?, 
                    stock_minimo = ?
                WHERE id_producto = ?
            `;

            await db.query(sql, [
                nombre,
                id_categoria,
                id_proveedor || null,
                precio_costo,
                precio_venta,
                stock,
                stock_minimo,
                id
            ]);

            res.json({ 
                message: "Producto actualizado correctamente" 
            });

        } catch (error) {
            res.status(500).json({ 
                error: "Error al actualizar", 
                details: error.message 
            });
        }
    },

    eliminar: async (req, res) => {
        const { id } = req.params;

        try {
            await db.query(
                'UPDATE productos SET activo = 0 WHERE id_producto = ?', 
                [id]
            );

            res.json({ 
                message: "Producto dado de baja correctamente" 
            });

        } catch (error) {
            res.status(500).json({ 
                error: "Error al eliminar", 
                details: error.message 
            });
        }
    },

    actualizarPreciosMasivo: async (req, res) => {
        const { porcentaje, id_categoria, id_proveedor } = req.body;

        if (!porcentaje || isNaN(porcentaje)) {
            return res.status(400).json({ error: "Porcentaje inválido" });
        }

        try {
            let condiciones = [];
            let params = [];

            if (id_categoria) {
                condiciones.push("id_categoria = ?");
                params.push(id_categoria);
            }

            if (id_proveedor) {
                condiciones.push("id_proveedor = ?");
                params.push(id_proveedor);
            }

            const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

            const sql = `
                UPDATE productos 
                SET precio_venta = precio_venta * (1 + ? / 100)
                ${where}
            `;

            await db.query(sql, [porcentaje, ...params]);

            res.json({ message: "Precios actualizados correctamente" });

        } catch (error) {
            res.status(500).json({ error: "Error al actualizar precios", details: error.message });
        }
    }
};

module.exports = productosController;