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
const inputCodigo = document.getElementById('codigo');

document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarProductos();
});

// Foco automático al abrir modal
document.getElementById('modalProducto').addEventListener('shown.bs.modal', () => {
    inputCodigo.focus();
});

// --- LOGICA DE PRODUCTOS ---

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        productos = await res.json();
        renderizarTabla(productos);
    } catch { console.error("Error al obtener productos"); }
}

function renderizarTabla(lista) {
    tablaBody.innerHTML = lista.map(p => `
        <tr class="${p.stock <= 5 ? 'stock-bajo' : ''}">
            <td class="text-muted small">${p.codigo_barras}</td>
            <td class="fw-bold">${p.nombre}</td>
            <td><span class="badge bg-light text-dark border">${p.nombre_categoria || 'S/C'}</span></td>
            <td class="fw-bold text-success">$${parseFloat(p.precio_venta).toFixed(2)}</td>
            <td class="fw-bold">${p.stock}</td>
            <td class="text-center">
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="prepararEdicion(${p.id_producto})">✎</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id_producto})">🗑</button>
                </div>
            </td>
        </tr>`).join('');
}

// Buscador en vivo
document.getElementById('buscar-producto').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(term) || p.codigo_barras.includes(term)
    );
    renderizarTabla(filtrados);
});

// Guardar (Alta / Edición)
formProd.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        codigo_barras: inputCodigo.value,
        nombre: document.getElementById('nombre').value,
        id_categoria: document.getElementById('categoria').value,
        precio_venta: document.getElementById('precio_venta').value,
        stock: document.getElementById('stock').value
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
            // Lógica Modo Rápido
            if (document.getElementById('modo-rapido').checked && !editandoID) {
                inputCodigo.value = '';
                document.getElementById('nombre').value = '';
                document.getElementById('precio_venta').value = '';
                inputCodigo.focus();
            } else {
                bootstrapModalProd.hide();
                limpiarFormulario();
            }
        }
    } catch { alert("Error al conectar con el servidor"); }
});

window.prepararEdicion = (id) => {
    const p = productos.find(x => x.id_producto === id);
    if (!p) return;
    editandoID = id;
    document.getElementById('modalTitulo').innerText = "Editar Producto";
    inputCodigo.value = p.codigo_barras;
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('categoria').value = p.id_categoria;
    document.getElementById('precio_venta').value = p.precio_venta;
    document.getElementById('stock').value = p.stock;
    bootstrapModalProd.show();
};

window.eliminarProducto = async (id) => {
    if (!confirm("¿Deseas dar de baja este producto?")) return;
    try {
        await fetch(`${API_URL}/productos/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` }
        });
        cargarProductos();
    } catch { alert("Error al eliminar"); }
};

function limpiarFormulario() {
    editandoID = null;
    formProd.reset();
    document.getElementById('modalTitulo').innerText = "Nuevo Producto";
}

// --- LOGICA DE CATEGORIAS ---

async function cargarCategorias() {
    try {
        const res = await fetch(`${API_URL}/categorias`, { headers: { 'Authorization': `Bearer ${token}` }});
        categorias = await res.json();
        
        const opts = categorias.map(c => `<option value="${c.id_categoria}">${c.nombre}</option>`).join('');
        document.getElementById('categoria').innerHTML = opts;
        document.getElementById('filtro-categoria').innerHTML = '<option value="">Todas las Categorías</option>' + opts;
        
        document.getElementById('lista-categorias-gestion').innerHTML = categorias.map(c => `
            <li class="list-group-item d-flex justify-content-between align-items-center py-2 small">
                ${c.nombre}
                <button class="btn btn-link text-danger p-0" onclick="eliminarCat(${c.id_categoria})">✕</button>
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
            body: JSON.stringify({ nombre: input.value })
        });
        if (res.ok) {
            input.value = '';
            cargarCategorias();
        }
    } catch { alert("Error al crear"); }
};

window.eliminarCat = async (id) => {
    if (!confirm("¿Eliminar categoría?")) return;
    await fetch(`${API_URL}/categorias/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
    cargarCategorias();
};

document.getElementById('btn-logout').onclick = () => { localStorage.clear(); window.location.href = 'login.html'; };

document.getElementById('btnNuevoProd').onclick = () => {
    limpiarFormulario();
};