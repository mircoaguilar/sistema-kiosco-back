(function verificarSesion() {
    if (!localStorage.getItem('jwt_token')) window.location.href = 'login.html';
})();

const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('jwt_token');
const idUsuario = localStorage.getItem('id_usuario');
const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Cajero';

let carrito = [];
let todosLosProductos = [];

// Elementos del DOM
const inputCodigo = document.getElementById('input-codigo');
const tablaCarrito = document.getElementById('tabla-carrito');
const totalVentaHTML = document.getElementById('total-venta');
const inputPagaCon = document.getElementById('input-paga-con');
const vueltoTexto = document.getElementById('vuelto-texto');
const inputPagoDigitalMonto = document.getElementById('input-pago-digital-monto');
const listaBusquedaManual = document.getElementById('lista-busqueda-manual');
const inputBusquedaManual = document.getElementById('input-busqueda-manual');

document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

// --- ESCANER ---
inputCodigo.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const codigo = inputCodigo.value.trim();
        if (codigo) await buscarProducto(codigo);
        inputCodigo.value = '';
    }
});

async function buscarProducto(codigo) {
    try {
        const res = await fetch(`${API_URL}/productos/${codigo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        agregarAlCarrito(await res.json());
    } catch { alert("Producto no encontrado"); }
}

// --- BUSCADOR MANUAL ---
document.getElementById('modalBusqueda').addEventListener('shown.bs.modal', async () => {
    inputBusquedaManual.focus();
    if (todosLosProductos.length === 0) {
        const res = await fetch(`${API_URL}/productos`, { headers: { 'Authorization': `Bearer ${token}` }});
        todosLosProductos = await res.json();
    }
    renderizarBusqueda(todosLosProductos);
});

inputBusquedaManual.addEventListener('input', (e) => {
    const t = e.target.value.toLowerCase();
    const filtrados = todosLosProductos.filter(p => p.nombre.toLowerCase().includes(t) || (p.codigo_barras && p.codigo_barras.includes(t)));
    renderizarBusqueda(filtrados);
});

function renderizarBusqueda(prods) {
    listaBusquedaManual.innerHTML = prods.slice(0, 20).map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td>$${parseFloat(p.precio_venta).toFixed(2)}</td>
            <td>${p.stock}</td>
            <td><button class="btn btn-sm btn-success" onclick='seleccionarManual(${JSON.stringify(p)})'>+</button></td>
        </tr>`).join('');
}

window.seleccionarManual = (p) => {
    agregarAlCarrito(p);
    bootstrap.Modal.getInstance(document.getElementById('modalBusqueda')).hide();
    inputCodigo.focus();
};

// --- CARRITO ---
function agregarAlCarrito(p) {
    const i = carrito.findIndex(item => item.id_producto === p.id_producto);
    if (i !== -1) carrito[i].cantidad++;
    else carrito.push({ id_producto: p.id_producto, nombre: p.nombre, precio_unitario: parseFloat(p.precio_venta), cantidad: 1 });
    renderizar();
}

function renderizar() {
    tablaCarrito.innerHTML = '';
    let total = 0;
    carrito.forEach((item, index) => {
        const sub = item.precio_unitario * item.cantidad;
        total += sub;
        tablaCarrito.innerHTML += `
            <tr>
                <td class="fw-bold">${item.nombre}</td>
                <td>$${item.precio_unitario.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-light border" onclick="modificar(${index}, -1)">-</button>
                    <span class="mx-2">${item.cantidad}</span>
                    <button class="btn btn-sm btn-light border" onclick="modificar(${index}, 1)">+</button>
                </td>
                <td class="text-success fw-bold">$${sub.toFixed(2)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="eliminar(${index})">X</button></td>
            </tr>`;
    });
    totalVentaHTML.innerText = `$${total.toFixed(2)}`;
    calcularVuelto();
}

window.modificar = (i, v) => { carrito[i].cantidad += v; if (carrito[i].cantidad <= 0) eliminar(i); else renderizar(); };
window.eliminar = (i) => { carrito.splice(i, 1); renderizar(); };

// --- VUELTO Y COBRO ---
inputPagaCon.addEventListener('input', calcularVuelto);

function calcularVuelto() {
    const total = parseFloat(totalVentaHTML.innerText.replace('$', '')) || 0;
    const paga = parseFloat(inputPagaCon.value) || 0;
    const vuelto = paga - total;
    vueltoTexto.innerText = `$${(vuelto > 0 ? vuelto : 0).toFixed(2)}`;
    vueltoTexto.className = vuelto > 0 ? "text-success fw-bold" : "text-dark fw-bold";
}

async function procesarVenta(metodo) {
    if (carrito.length === 0) return alert("Carrito vacío");
    
    const total = carrito.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
    
    // Validación de pago mixto
    if (metodo === 'Mixto') {
        const efectivo = parseFloat(inputPagaCon.value) || 0;
        const digital = parseFloat(inputPagoDigitalMonto.value) || 0;
        if ((efectivo + digital) < total) return alert("El monto total no cubre la venta");
    }

    const venta = {
        id_usuario: parseInt(idUsuario),
        metodo_pago: metodo,
        total_venta: total,
        imprimir_ticket: document.getElementById('check-ticket').checked,
        items: carrito
    };

    try {
        const res = await fetch(`${API_URL}/ventas`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(venta)
        });
        if (res.ok) {
            alert("Venta exitosa");
            carrito = [];
            inputPagaCon.value = '';
            inputPagoDigitalMonto.value = '';
            renderizar();
        }
    } catch { alert("Error al procesar"); }
}

document.getElementById('btn-pago-efectivo').onclick = () => procesarVenta('Efectivo');
document.getElementById('btn-pago-digital').onclick = () => procesarVenta('Digital');
document.getElementById('btn-pago-mixto').onclick = () => procesarVenta('Mixto');

document.getElementById('btn-logout').onclick = () => { localStorage.clear(); window.location.href = 'login.html'; };

// Foco constante al escaner
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName !== 'INPUT') inputCodigo.focus();
});
inputCodigo.focus();