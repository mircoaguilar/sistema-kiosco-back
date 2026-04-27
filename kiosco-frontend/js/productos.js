(function verificarSesion() {
    if (!localStorage.getItem('jwt_token')) window.location.href = 'login.html';
})();

const API_URL = window.APP_CONFIG.API_URL;
const token = localStorage.getItem('jwt_token');
const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Cajero';

let productos = [];
let categorias = [];
let proveedores = [];
let offcanvasCategorias;
let editandoID = null;

const bootstrapModalProd = new bootstrap.Modal(document.getElementById('modalProducto'));
const formProd = document.getElementById('form-producto');
const tablaBody = document.getElementById('tabla-productos-body');

const modalConfirm = new bootstrap.Modal(document.getElementById('modalConfirm'));
const btnConfirmarAccion = document.getElementById('btnConfirmarAccion');

document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    cargarProveedores();
    cargarProductos();

    const el = document.getElementById('offcanvasCategorias');

    if (el) {
        offcanvasCategorias = new bootstrap.Offcanvas(el);

        document.getElementById('btnAbrirCategorias').onclick = () => {
            bootstrapModalProd.hide();  

            setTimeout(() => {
                offcanvasCategorias.show(); 
            }, 300); 
        };
    }
});

function mostrarToast(mensaje, tipo = 'success') {
    const contenedor = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${mensaje}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    contenedor.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

function confirmar(mensaje) {
    return new Promise((resolve) => {
        document.getElementById('modalConfirmMsg').innerText = mensaje;
        modalConfirm.show();
        
        const handler = () => {
            modalConfirm.hide();
            btnConfirmarAccion.removeEventListener('click', handler);
            resolve(true);
        };
        
        btnConfirmarAccion.addEventListener('click', handler);
        document.querySelector('#modalConfirm [data-bs-dismiss="modal"]').onclick = () => resolve(false);
    });
}

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

async function cargarProveedores() {
    try {
        const res = await fetch(`${API_URL}/proveedores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        proveedores = await res.json();

        const select = document.getElementById('proveedor');
        select.innerHTML = '<option value="">Sin proveedor</option>' +
            proveedores.map(p => `
                <option value="${p.id_proveedor}">${p.nombre}</option>
            `).join('');

        const selectFiltro = document.getElementById('filtro-proveedor');
        selectFiltro.innerHTML = '<option value="">Todos los Proveedores</option>' +
            proveedores.map(p => `
                <option value="${p.id_proveedor}">${p.nombre}</option>
            `).join('');

    } catch (error) {
        console.error("Error proveedores", error);
    }
}

// --- GESTIÓN DE PRODUCTOS ---

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`, { headers: { 'Authorization': `Bearer ${token}` }});
        productos = await res.json();
        aplicarFiltros();
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
            <td>${p.nombre_proveedor || '-'}</td>
            <td class="text-end fw-bold text-success precio-destacado">${precioARS}</td>
            <td class="text-center">
                <span class="badge ${esBajo ? 'bg-danger' : 'bg-dark'} px-2 py-2" style="min-width: 40px">
                    ${parseFloat(p.stock)} ${p.es_pesable == 1 ? 'kg' : 'Unidades'}
                </span>
                <small class="text-muted d-block mt-1" style="font-size: 0.65rem">Mín: ${parseFloat(p.stock_minimo)}</small>
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
        id_proveedor: document.getElementById('proveedor').value || null,
        precio_costo: parseFloat(document.getElementById('precio_costo').value) || 0,
        precio_venta: parseFloat(document.getElementById('precio_venta').value),
        stock: parseFloat(document.getElementById('stock').value), 
        stock_minimo: parseInt(document.getElementById('stock_minimo').value),
        es_pesable: document.getElementById('es_pesable').checked ? 1 : 0 
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

        mostrarToast(
            editandoID ? "Producto actualizado correctamente" : "Producto creado correctamente",
            editandoID ? "info" : "success"
        );

        await cargarProductos();

        if (document.getElementById('modo-rapido').checked && !editandoID) {
            document.getElementById('codigo').value = '';
            document.getElementById('nombre').value = '';
            document.getElementById('precio_venta').value = '';
            document.getElementById('stock').value = '';
            document.getElementById('codigo').focus();
        } else {
            bootstrapModalProd.hide();
            limpiarFormulario();
        }
        } else {
            mostrarToast("Error al guardar el producto", "danger");
        }
    } catch (error) {
        console.error(error);
        mostrarToast("Error de conexión al servidor", "danger");
    }
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
    document.getElementById('proveedor').value = p.id_proveedor || '';
    document.getElementById('precio_costo').value = p.precio_costo;
    document.getElementById('precio_venta').value = p.precio_venta;
    document.getElementById('stock').value = p.stock;
    document.getElementById('stock_minimo').value = p.stock_minimo;
    document.getElementById('es_pesable').checked = (p.es_pesable === 1); 
    
    bootstrapModalProd.show();
};

window.eliminarProducto = async (id) => {
    if (!(await confirmar("¿Dar de baja este producto?"))) return;
    try {
        const res = await fetch(`${API_URL}/productos/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            productos = productos.filter(p => p.id_producto !== id);
            renderizarTabla(productos);
            mostrarToast("Producto dado de baja correctamente", "warning");
        }
    } catch { mostrarToast("Error al eliminar", "danger"); }
};

window.eliminarCat = async (id) => {
    const tieneProductos = productos.some(p => p.id_categoria == id && p.activo !== 0);

    if (tieneProductos) {
        return mostrarToast("No podés eliminar: tiene productos activos", "danger");
    }

    if (!(await confirmar("¿Eliminar categoría definitivamente?"))) return;
    try {
        const res = await fetch(`${API_URL}/categorias/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
        if (res.ok) {
            await cargarCategorias();
            mostrarToast("Categoría eliminada", "success");
        } else {
            mostrarToast("Error al eliminar categoría", "danger");
        }
    } catch {
        mostrarToast("Error de red", "danger");
    }
};

function limpiarFormulario() {
    editandoID = null;
    formProd.reset();
    document.getElementById('modalTitulo').innerText = "Nuevo Producto";
    document.getElementById('stock_minimo').value = "5";
    document.getElementById('es_pesable').checked = false; 
}

function aplicarFiltros() {
    const texto = document.getElementById('buscar-producto').value.toLowerCase();
    const categoria = document.getElementById('filtro-categoria').value;
    const proveedor = document.getElementById('filtro-proveedor').value;

    let filtrados = productos;

    if (texto) {
        filtrados = filtrados.filter(p =>
            p.nombre.toLowerCase().includes(texto) ||
            (p.codigo_barras && p.codigo_barras.toLowerCase().includes(texto))
        );
    }

    if (categoria) {
        filtrados = filtrados.filter(p => p.id_categoria == categoria);
    }

    if (proveedor) {
        filtrados = filtrados.filter(p => p.id_proveedor == proveedor);
    }

    renderizarTabla(filtrados);
}

document.getElementById('buscar-producto').addEventListener('input', aplicarFiltros);
document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltros);
document.getElementById('filtro-proveedor').addEventListener('change', aplicarFiltros);

document.getElementById('btnNuevoProd').onclick = async () => {
    limpiarFormulario();
    await cargarCategorias();
    bootstrapModalProd.show();
};

const modalPrecios = new bootstrap.Modal(document.getElementById('modalPrecios'));

document.getElementById('btnSubaMasiva').onclick = async () => {
    // cargar selects
    document.getElementById('filtro-cat-precio').innerHTML =
        '<option value="">Todas</option>' +
        categorias.map(c => `<option value="${c.id_categoria}">${c.nombre_categoria}</option>`).join('');

    document.getElementById('filtro-prov-precio').innerHTML =
        '<option value="">Todos</option>' +
        proveedores.map(p => `<option value="${p.id_proveedor}">${p.nombre}</option>`).join('');

    modalPrecios.show();
};

document.getElementById('aplicarSuba').onclick = async () => {
    const porcentaje = parseFloat(document.getElementById('porcentaje').value);
    const id_categoria = document.getElementById('filtro-cat-precio').value;
    const id_proveedor = document.getElementById('filtro-prov-precio').value;

    if (!porcentaje) {
        mostrarToast("Ingresá un porcentaje válido", "warning");
        return;
    }

    if (!(await confirmar(`¿Aplicar ${porcentaje}% de aumento a los productos?`))) return;

    try {
        const res = await fetch(`${API_URL}/productos/precios/masivo`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                porcentaje,
                id_categoria: id_categoria || null,
                id_proveedor: id_proveedor || null
            })
        });

        if (res.ok) {
                mostrarToast("Precios actualizados exitosamente", "success");
                modalPrecios.hide();
                await cargarProductos();
            } else {
                mostrarToast("No se pudieron actualizar los precios", "danger");
            }
        } catch {
            mostrarToast("Error de conexión al actualizar", "danger");
        }
};

document.getElementById('form-nueva-cat').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('input-nueva-cat');

    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre_categoria: input.value })
        });

        if (res.ok) {
            input.value = '';
            await cargarCategorias();

            mostrarToast("Categoría creada", "success");

            const ultima = categorias[categorias.length - 1];
            document.getElementById('categoria').value = ultima.id_categoria;

            offcanvasCategorias.hide();

            setTimeout(() => {
                bootstrapModalProd.show(); 
            }, 300);
        }

    } catch {
        mostrarToast("Error al crear categoría", "danger");
    }
};

document.getElementById('es_pesable').addEventListener('change', function() {
    const labelStock = document.querySelector('label[for="stock"]'); 
    const inputStock = document.getElementById('stock');
    
    if (this.checked) {
        inputStock.placeholder = "0.000 kg";
    } else {
        inputStock.placeholder = "";
    }
});

document.getElementById('btn-logout').onclick = () => { localStorage.clear(); window.location.href = 'login.html'; };