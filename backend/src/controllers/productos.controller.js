const db = require('../config/db');

const productosController = {
    obtenerTodos: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT p.*, c.nombre_categoria FROM productos p LEFT JOIN categorias c ON p.id_categoria = c.id_categoria WHERE p.activo = 1');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener productos", details: error.message });
        }
    },

    obtenerPorCodigo: async (req, res) => {
        const { codigo } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM productos WHERE codigo_barras = ?', [codigo]);
            
            if (rows.length === 0) {
                return res.status(404).json({ message: "Producto no encontrado" });
            }
            
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar producto", details: error.message });
        }
    },

    crear: async (req, res) => {
        const { codigo_barras, nombre, id_categoria, precio_costo, precio_venta, stock, stock_minimo } = req.body;
        try {
            const sql = `INSERT INTO productos (codigo_barras, nombre, id_categoria, precio_costo, precio_venta, stock, stock_minimo) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const [result] = await db.query(sql, [codigo_barras, nombre, id_categoria, precio_costo, precio_venta, stock, stock_minimo]);
            res.json({ message: "Producto creado con éxito", id: result.insertId });
        } catch (error) {
            res.status(500).json({ error: "Error al crear producto", details: error.message });
        }
    },

    actualizar: async (req, res) => {
        const { id } = req.params;
        const { nombre, id_categoria, precio_costo, precio_venta, stock, stock_minimo } = req.body;
        try {
            const sql = `UPDATE productos SET nombre=?, id_categoria=?, precio_costo=?, precio_venta=?, stock=?, stock_minimo=? 
                         WHERE id_producto=?`;
            await db.query(sql, [nombre, id_categoria, precio_costo, precio_venta, stock, stock_minimo, id]);
            res.json({ message: "Producto actualizado correctamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al actualizar", details: error.message });
        }
    },

    eliminar: async (req, res) => {
        const { id } = req.params;
        try {
            await db.query('UPDATE productos SET activo = 0 WHERE id_producto = ?', [id]);
            res.json({ message: "Producto dado de baja correctamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar", details: error.message });
        }
    }
};

module.exports = productosController;