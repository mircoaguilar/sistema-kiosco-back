(function verificarSesion() {
    if (!localStorage.getItem('jwt_token')) {
        window.location.href = 'login.html';
    }
})();

const API_URL = window.APP_CONFIG.API_URL;
const token = localStorage.getItem('jwt_token');
const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Usuario';

document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

const tabla = document.getElementById('tabla-historial');

let ventaSeleccionada = null;
let ventaCorregir = null;
let productosCorreccion = [];

async function cargarHistorial() {
    try {
        const desde = document.getElementById('filtro-desde').value;
        const hasta = document.getElementById('filtro-hasta').value;
        const estado = document.getElementById('filtro-estado').value;

        let url = `${API_URL}/ventas/historial`;
        const params = [];

        if (desde) params.push(`desde=${desde}`);
        if (hasta) params.push(`hasta=${hasta}`);
        if (estado) params.push(`estado=${estado}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Error al cargar historial');
        }

        renderTabla(data);

    } catch (error) {
        console.error(error);

        tabla.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    Error al cargar historial
                </td>
            </tr>
        `;
    }
}

function mostrarToast(mensaje, tipo = 'success') {
    let toastContainer = document.getElementById('toast-container');

    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const toastId = `toast-${Date.now()}`;

    const colores = {
        success: 'text-bg-success',
        danger: 'text-bg-danger',
        warning: 'text-bg-warning',
        info: 'text-bg-primary'
    };

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center ${colores[tipo] || colores.success} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${mensaje}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        delay: 3000
    });

    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function renderTabla(ventas) {
    if (!ventas || ventas.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    No hay ventas registradas
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = ventas.map(v => `
        <tr>
            <td>#${v.id_venta}</td>
            <td>${formatearFecha(v.fecha_hora)}</td>
            <td>${v.vendedor}</td>
            <td class="text-capitalize">${v.metodo_pago}</td>
            <td class="fw-bold text-success">$${parseFloat(v.total_final).toFixed(2)}</td>
            <td>
                <span class="${v.estado === 'anulada' ? 'estado-anulada' : 'estado-activa'}">
                    ${v.estado}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="verDetalleVenta(${v.id_venta})">
                    Ver
                </button>

                ${v.estado !== 'anulada'
                    ? `
                        <button class="btn btn-sm btn-warning me-1" onclick="abrirModalCorregir(${v.id_venta})">
                            Corregir
                        </button>

                        <button class="btn btn-sm btn-danger" onclick="abrirModalAnular(${v.id_venta})">
                            Anular
                        </button>
                    `
                    : ''
                }
            </td>
        </tr>
    `).join('');
}

async function verDetalleVenta(idVenta) {
    try {
        const res = await fetch(`${API_URL}/ventas/${idVenta}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Error al obtener detalle');
        }

        renderDetalleModal(data);

        const modal = new bootstrap.Modal(document.getElementById('modalDetalleVenta'));
        modal.show();

    } catch (error) {
        console.error(error);
        mostrarToast('Error al cargar detalle de venta', 'danger');
    }
}

function renderDetalleModal(data) {
    const venta = data.venta;
    const items = data.items;

    const contenido = document.getElementById('detalle-venta-contenido');

    contenido.innerHTML = `
        <div class="mb-3">
            <strong>Venta:</strong> #${venta.id_venta}<br>
            <strong>Fecha:</strong> ${formatearFecha(venta.fecha_hora)}<br>
            <strong>Vendedor:</strong> ${venta.vendedor}<br>
            <strong>Método:</strong> ${venta.metodo_pago}<br>
            <strong>Estado:</strong> ${venta.estado}
        </div>

        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.nombre}</td>
                            <td>${parseFloat(item.cantidad)}</td>
                            <td>$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                            <td>$${parseFloat(item.subtotal).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="mt-3">
            <strong>Total Venta:</strong> $${parseFloat(venta.total_venta).toFixed(2)}<br>
            <strong>Recargo:</strong> $${parseFloat(venta.recargo_monto || 0).toFixed(2)}<br>
            <strong>Total Final:</strong> 
            <span class="text-success fw-bold">
                $${parseFloat(venta.total_final).toFixed(2)}
            </span>
        </div>

        ${venta.motivo_anulacion ? `
            <div class="alert alert-danger mt-3">
                <strong>Motivo de anulación:</strong><br>
                ${venta.motivo_anulacion}
            </div>
        ` : ''}
    `;
}

function abrirModalAnular(idVenta) {
    ventaSeleccionada = idVenta;

    document.getElementById('venta-id-anular').value = idVenta;
    document.getElementById('motivo-anulacion').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modalAnularVenta'));
    modal.show();
}

async function abrirModalCorregir(idVenta) {
    ventaCorregir = idVenta;

    document.getElementById('venta-id-corregir').value = idVenta;
    document.getElementById('motivo-correccion').value = '';

    try {
        const res = await fetch(`${API_URL}/ventas/${idVenta}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Error al cargar venta');
        }

        productosCorreccion = data.items.map(item => ({
            id_producto: item.id_producto,
            nombre: item.nombre,
            cantidad: parseFloat(item.cantidad),
            precio_unitario: parseFloat(item.precio_unitario),
            es_manual: item.es_manual || 0
        }));

        renderProductosCorreccion();

        const modal = new bootstrap.Modal(document.getElementById('modalCorregirVenta'));
        modal.show();

    } catch (error) {
        console.error(error);
        mostrarToast('Error al cargar productos para corrección', 'danger');
    }
}

function renderProductosCorreccion() {
    const tabla = document.getElementById('tabla-correccion-items');
    let total = 0;

    if (!productosCorreccion.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay productos
                </td>
            </tr>
        `;
        document.getElementById('total-corregido').innerText = '$0.00';
        return;
    }

    tabla.innerHTML = productosCorreccion.map((item, index) => {
        const subtotal = item.cantidad * item.precio_unitario;
        total += subtotal;

        return `
            <tr>
                <td>
                    <input 
                        type="text"
                        class="form-control"
                        value="${item.nombre}"
                        onchange="actualizarNombreProducto(${index}, this.value)"
                    >
                </td>

                <td>
                    <input
                        type="number"
                        min="1"
                        step="0.01"
                        class="form-control"
                        value="${item.cantidad}"
                        onchange="actualizarCantidadProducto(${index}, this.value)"
                    >
                </td>

                <td>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        class="form-control"
                        value="${item.precio_unitario}"
                        onchange="actualizarPrecioProducto(${index}, this.value)"
                    >
                </td>

                <td class="fw-bold">
                    $${subtotal.toFixed(2)}
                </td>

                <td>
                    <button
                        class="btn btn-sm btn-danger"
                        onclick="eliminarProductoCorreccion(${index})"
                    >
                        X
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('total-corregido').innerText = `$${total.toFixed(2)}`;
}

function actualizarNombreProducto(index, valor) {
    productosCorreccion[index].nombre = valor;
}

function actualizarCantidadProducto(index, valor) {
    productosCorreccion[index].cantidad = parseFloat(valor) || 1;
    renderProductosCorreccion();
}

function actualizarPrecioProducto(index, valor) {
    productosCorreccion[index].precio_unitario = parseFloat(valor) || 0;
    renderProductosCorreccion();
}

function eliminarProductoCorreccion(index) {
    productosCorreccion.splice(index, 1);
    renderProductosCorreccion();
}

document.getElementById('confirmar-correccion').addEventListener('click', async () => {
    const motivo = document.getElementById('motivo-correccion').value.trim();

    if (!motivo || motivo.length < 3) {
        mostrarToast('Ingrese un motivo válido', 'warning');
        return;
    }

    try {
        const detalleRes = await fetch(`${API_URL}/ventas/${ventaCorregir}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const detalleData = await detalleRes.json();

        if (!detalleRes.ok) {
            throw new Error(detalleData.error || 'Error al obtener venta');
        }

        const venta = detalleData.venta;
        const items = productosCorreccion.map(item => ({
                            id_producto: item.id_producto,
                            cantidad: item.cantidad,
                            precio_unitario: item.precio_unitario,
                            es_manual: item.es_manual,
                            descripcion_manual: item.es_manual ? item.nombre : null
                        }));

        const payload = {
            motivo,
            metodo_pago: venta.metodo_pago,
            monto_efectivo: venta.monto_efectivo,
            monto_transferencia: venta.monto_transferencia,
            monto_tarjeta: venta.monto_tarjeta,
            tipo_tarjeta: venta.tipo_tarjeta,
            items
        };

        const res = await fetch(`${API_URL}/ventas/${ventaCorregir}/corregir`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Error al corregir venta');
        }

        mostrarToast('Venta corregida correctamente', 'success');

        bootstrap.Modal.getInstance(document.getElementById('modalCorregirVenta')).hide();

        cargarHistorial();

    } catch (error) {
        console.error(error);
        mostrarToast(error.message, 'danger');
    }
});

document.getElementById('confirmar-anulacion').addEventListener('click', async () => {
    const motivo = document.getElementById('motivo-anulacion').value.trim();

    if (!motivo || motivo.length < 3) {
        mostrarToast('Ingrese un motivo válido', 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/ventas/${ventaSeleccionada}/anular`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ motivo })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Error al anular venta');
        }

        mostrarToast('Venta anulada correctamente', 'success');

        bootstrap.Modal.getInstance(document.getElementById('modalAnularVenta')).hide();

        cargarHistorial();

    } catch (error) {
        console.error(error);
        mostrarToast(error.message, 'danger');
    }
});

document.getElementById('btn-agregar-producto-corregir').addEventListener('click', () => {
    productosCorreccion.push({
        id_producto: null,
        nombre: '',
        cantidad: 1,
        precio_unitario: 0,
        es_manual: 1
    });

    renderProductosCorreccion();
});

document.getElementById('btn-limpiar').addEventListener('click', () => {
    const d = new Date();
    const hoy = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

    document.getElementById('filtro-desde').value = hoy;
    document.getElementById('filtro-hasta').value = hoy;
    document.getElementById('filtro-estado').value = '';

    cargarHistorial();
});

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

document.getElementById('filtro-desde').addEventListener('change', cargarHistorial);
document.getElementById('filtro-hasta').addEventListener('change', cargarHistorial);
document.getElementById('filtro-estado').addEventListener('change', cargarHistorial);


document.addEventListener('DOMContentLoaded', async () => {
    const d = new Date();
    const hoy = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

    document.getElementById('filtro-desde').value = hoy;
    document.getElementById('filtro-hasta').value = hoy;

    await cargarHistorial();
});

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleString('es-AR');
}