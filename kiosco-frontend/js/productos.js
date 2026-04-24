(function verificarSesion() {
    if (!localStorage.getItem('jwt_token')) window.location.href = 'login.html';
})();

const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('jwt_token');
const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Cajero';

let productos = [];
let categorias = [];
let editandoID = null;

const bootstrapModalProd = new bootstrap.Modal(document.getElementById('modalProducto'));
const formProd = document.getElementById('form-producto');
const tablaBody = document.getElementById('tabla-productos-body');

document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarProductos();
});

// --- GESTIÓN DE CATEGORÍAS ---

async function cargarCategorias() {
    try {
        const res = await fetch(`${API_URL}/categorias`, { headers: { 'Authorization': `Bearer ${token}` }});
        categorias = await res.json();
        
        const opts = categorias.map(c => `<option value="${c.id_categoria}">${c.nombre_categoria}</option>`).join('');
        document.getElementById('categoria').innerHTML = opts;
        document.getElementById('filtro-categoria').innerHTML = '<option value="">Todas las Categorías</option>' + opts;
        
        document.getElementById('lista-categorias-gestion').innerHTML = categorias.map(c => `
            <li class="list-group-item d-flex justify-content-between align-items-center py-2 small">
                ${c.nombre_categoria}
                <button class="btn btn-link text-danger p-0" onclick="eliminarCat(${c.id_categoria})">
                    <i class="bi bi-x-circle-fill"></i>
                </button>
            </li>`).join('');
    } catch { console.error("Error categorías"); }
}

document.getElementById('form-nueva-cat').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('input-nueva-cat');
    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_categoria: input.value }) 
        });
        if (res.ok) {
            input.value = '';
            await cargarCategorias(); 
        }
    } catch { alert("Error al crear categoría"); }
};

// --- GESTIÓN DE PRODUCTOS ---

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`, { headers: { 'Authorization': `Bearer ${token}` }});
        productos = await res.json();
        renderizarTabla(productos);
    } catch { console.error("Error productos"); }
}

function renderizarTabla(lista) {
    // Filtrar solo activos para la tabla
    const activos = lista.filter(p => p.activo !== 0);

    tablaBody.innerHTML = activos.map(p => {
        const esBajo = parseInt(p.stock) <= parseInt(p.stock_minimo);
        const precioARS = parseFloat(p.precio_venta).toLocaleString('es-AR', { 
            style: 'currency', currency: 'ARS' 
        });

        return `
        <tr class="${esBajo ? 'stock-bajo' : ''}">
            <td class="text-muted small">${p.codigo_barras}</td>
            <td class="fw-bold">${p.nombre}</td>
            <td><span class="badge bg-light text-dark border px-2 py-2">${p.nombre_categoria || 'General'}</span></td>
            <td class="text-end fw-bold text-success precio-destacado">${precioARS}</td>
            <td class="text-center">
                <span class="badge ${esBajo ? 'bg-danger' : 'bg-dark'} px-2 py-2" style="min-width: 40px">
                    ${p.stock}
                </span>
                <small class="text-muted d-block mt-1" style="font-size: 0.65rem">Mín: ${p.stock_minimo}</small>
            </td>
            <td class="text-center">
                <div class="btn-group shadow-sm border rounded overflow-hidden">
                    <button class="btn btn-acciones text-primary border-end" onclick="prepararEdicion(${p.id_producto})" title="Editar">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="btn btn-acciones text-danger" onclick="eliminarProducto(${p.id_producto})" title="Baja">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

formProd.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        codigo_barras: document.getElementById('codigo').value,
        nombre: document.getElementById('nombre').value,
        id_categoria: document.getElementById('categoria').value,
        precio_costo: parseFloat(document.getElementById('precio_costo').value) || 0,
        precio_venta: parseFloat(document.getElementById('precio_venta').value),
        stock: parseInt(document.getElementById('stock').value),
        stock_minimo: parseInt(document.getElementById('stock_minimo').value)
    };

    const url = editandoID ? `${API_URL}/productos/${editandoID}` : `${API_URL}/productos`;
    const metodo = editandoID ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            await cargarProductos();
            if (document.getElementById('modo-rapido').checked && !editandoID) {
                document.getElementById('codigo').value = '';
                document.getElementById('nombre').value = '';
                document.getElementById('codigo').focus();
            } else {
                bootstrapModalProd.hide();
                limpiarFormulario();
            }
        }
    } catch { alert("Error de red"); }
});

window.prepararEdicion = async (id) => {
    const p = productos.find(x => x.id_producto === id);
    if (!p) return;
    await cargarCategorias();
    editandoID = id;
    document.getElementById('modalTitulo').innerText = "Editar Producto";
    document.getElementById('codigo').value = p.codigo_barras;
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('categoria').value = p.id_categoria;
    document.getElementById('precio_costo').value = p.precio_costo;
    document.getElementById('precio_venta').value = p.precio_venta;
    document.getElementById('stock').value = p.stock;
    document.getElementById('stock_minimo').value = p.stock_minimo;
    bootstrapModalProd.show();
};

window.eliminarProducto = async (id) => {
    if (!confirm("¿Dar de baja este producto? No aparecerá en el inventario activo.")) return;
    try {
        const res = await fetch(`${API_URL}/productos/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            // Baja lógica en el front instantánea
            productos = productos.filter(p => p.id_producto !== id);
            renderizarTabla(productos);
        }
    } catch { alert("Error al eliminar"); }
};

window.eliminarCat = async (id) => {
    if (!confirm("¿Eliminar categoría?")) return;
    await fetch(`${API_URL}/categorias/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
    await cargarCategorias();
};

function limpiarFormulario() {
    editandoID = null;
    formProd.reset();
    document.getElementById('modalTitulo').innerText = "Nuevo Producto";
    document.getElementById('stock_minimo').value = "5";
}

document.getElementById('btnNuevoProd').onclick = async () => {
    limpiarFormulario();
    await cargarCategorias();
    bootstrapModalProd.show();
};

document.getElementById('btn-logout').onclick = () => { localStorage.clear(); window.location.href = 'login.html'; };