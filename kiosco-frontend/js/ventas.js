(function verificarSesion() {
    if (!localStorage.getItem('jwt_token')) window.location.href = 'login.html';
})();

const API_URL = window.APP_CONFIG.API_URL;
const token = localStorage.getItem('jwt_token');
const idUsuario = localStorage.getItem('id_usuario');
const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Cajero';

let carrito = [];
let todosLosProductos = [];
window.montoDigitalTemporal = 0;

const inputCodigo = document.getElementById('input-codigo');
const tablaCarrito = document.getElementById('tabla-carrito');
const totalVentaHTML = document.getElementById('total-venta');
const inputPagaCon = document.getElementById('input-paga-con');
const vueltoTexto = document.getElementById('vuelto-texto');
const listaBusquedaManual = document.getElementById('lista-busqueda-manual');
const inputBusquedaManual = document.getElementById('input-busqueda-manual');

const modalMixto = new bootstrap.Modal(document.getElementById('modalMixto'));
const mixtoTotal = document.getElementById('mixto-total');
const mixtoEfectivo = document.getElementById('mixto-efectivo');
const mixtoTransferencia = document.getElementById('mixto-transferencia');
const modalTarjeta = new bootstrap.Modal(document.getElementById('modalTarjeta'));
const tarjetaTotal = document.getElementById('tarjeta-total');


function mostrarToast(mensaje, tipo = "success") {
    const toastEl = document.getElementById('toast');
    const toastBody = document.getElementById('toast-body');

    toastBody.innerText = mensaje;

    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning');

    if (tipo === "success") toastEl.classList.add('bg-success');
    if (tipo === "error") toastEl.classList.add('bg-danger');
    if (tipo === "warning") toastEl.classList.add('bg-warning');

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

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
    } catch { mostrarToast("Producto no encontrado", "error"); }
}

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
            <td><button class="btn btn-sm btn-success" onclick='seleccionarManual(${JSON.stringify(p)})'>+</button></td>
        </tr>`).join('');
}

window.seleccionarManual = (p) => {
    agregarAlCarrito(p);
    bootstrap.Modal.getInstance(document.getElementById('modalBusqueda')).hide();
    inputCodigo.focus();
};

let productoPendiente = null;

function agregarAlCarrito(p) {
    if (p.es_pesable) {
        // Guardamos el producto y abrimos el modal en lugar del prompt
        productoPendiente = p;
        document.getElementById('label-producto-pesable').innerText = `¿Cuántos kg de ${p.nombre}?`;
        document.getElementById('input-peso-modal').value = '';
        new bootstrap.Modal(document.getElementById('modalPeso')).show();
        setTimeout(() => document.getElementById('input-peso-modal').focus(), 500);
    } else {
        // Lógica normal
        const i = carrito.findIndex(item => item.id_producto === p.id_producto);
        if (i !== -1) carrito[i].cantidad += 1;
        else carrito.push({
            id_producto: p.id_producto,
            nombre: p.nombre,
            precio_unitario: parseFloat(p.precio_venta),
            cantidad: 1
        });
        renderizar();
    }
}

function renderizar() {
    tablaCarrito.innerHTML = '';
    let total = 0;

    carrito.forEach((item, index) => {
        const sub = item.precio_unitario * item.cantidad;
        total += sub;

        // Determinamos la etiqueta: Si es pesable, usamos 'kg', sino 'unid.'
        const unidadMedida = item.es_pesable ? "kg" : "";
        
        // Formato: si es pesable mostramos 3 decimales, sino 0 decimales (para unidades)
        const displayCantidad = item.es_pesable ? item.cantidad.toFixed(3) : item.cantidad;

        tablaCarrito.innerHTML += `
            <tr>
                <td class="fw-bold">${item.nombre}</td>
                <td>$${item.precio_unitario.toFixed(2)}</td>
                <td>
                    ${!item.es_pesable ? `
                        <button class="btn btn-sm btn-light border" onclick="modificar(${index}, -1)">-</button>
                    ` : ''}
                    
                    <span class="mx-2">${displayCantidad} ${unidadMedida}</span>
                    
                    ${!item.es_pesable ? `
                        <button class="btn btn-sm btn-light border" onclick="modificar(${index}, 1)">+</button>
                    ` : ''}
                </td>
                <td class="text-success fw-bold">$${sub.toFixed(2)}</td>
                <td><button class="btn btn-danger btn-sm" onclick="eliminar(${index})">X</button></td>
            </tr>`;
    });

    totalVentaHTML.innerText = `$${total.toFixed(2)}`;
    calcularVuelto();
}

window.modificar = (i, v) => { 
    carrito[i].cantidad += v; 
    if (carrito[i].cantidad <= 0) eliminar(i); 
    else renderizar(); 
};

window.eliminar = (i) => { 
    carrito.splice(i, 1); 
    renderizar(); 
};

inputPagaCon.addEventListener('input', calcularVuelto);

function calcularVuelto() {
    const total = parseFloat(totalVentaHTML.innerText.replace('$', '')) || 0;
    const paga = parseFloat(inputPagaCon.value) || 0;
    const vuelto = paga - total;
    vueltoTexto.innerText = `$${(vuelto > 0 ? vuelto : 0).toFixed(2)}`;
    vueltoTexto.className = vuelto > 0 ? "text-success fw-bold" : "text-dark fw-bold";
}

async function procesarVenta(metodo) {
    if (carrito.length === 0) return mostrarToast("Carrito vacío", "warning");

    const totalVenta = carrito.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
    const imprimirTicket = document.getElementById('check-ticket') ? document.getElementById('check-ticket').checked : false;

    const pagaEfectivo = parseFloat(inputPagaCon.value) || 0;
    const pagaDigital = parseFloat(window.montoDigitalTemporal) || 0;

    if (metodo === 'efectivo' && pagaEfectivo < totalVenta) {
        return mostrarToast("El efectivo recibido es menor al total", "warning");
    }

    if (metodo === 'mixto') {
        const suma = pagaEfectivo + pagaDigital;
        if (Math.abs(suma - totalVenta) > 0.01) {
            return alert("La suma de efectivo y transferencia no coincide con el total de la venta");
        }
        if (pagaEfectivo <= 0 || pagaDigital <= 0) {
            return alert("El monto en efectivo y el monto digital deben ser mayores a 0");
        }
    }

    const montoEfectivo = (metodo === 'efectivo') ? totalVenta : (metodo === 'mixto' ? pagaEfectivo : 0);
    const montoDigital = (metodo === 'transferencia') ? totalVenta : (metodo === 'mixto' ? pagaDigital : 0);
    const montoPagado = (metodo === 'efectivo') ? pagaEfectivo : (metodo === 'transferencia') ? totalVenta : (pagaEfectivo + pagaDigital);

    const venta = {
        id_usuario: parseInt(idUsuario),
        metodo_pago: metodo, 
        total_venta: totalVenta,
        monto_efectivo: montoEfectivo,
        monto_transferencia: montoDigital,
        monto_pagado: montoPagado,
        imprimir_ticket: imprimirTicket,
        items: carrito
    };

    try {
        const res = await fetch(`${API_URL}/ventas`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(venta)
        });

        if (!res.ok) throw new Error();

        mostrarToast("Venta exitosa", "success");

        carrito = [];
        inputPagaCon.value = '';
        window.montoDigitalTemporal = 0;
        renderizar();

    } catch (e) { 
        console.error(e);
        mostrarToast("Error al procesar la venta", "error"); 
    }
}

function abrirModalVentaRapida() {
    const modalEl = document.getElementById('modalVentaRapida');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    document.getElementById("vr-descripcion").value = '';
    document.getElementById("vr-monto").value = '';
    document.getElementById("vr-cantidad").value = 1;
    document.getElementById("vr-categoria").value = '';
}

function agregarVentaRapida() {
    const descripcion = document.getElementById("vr-descripcion").value;
    const categoria = document.getElementById("vr-categoria").value;
    const monto = parseFloat(document.getElementById("vr-monto").value);
    const cantidad = parseFloat(document.getElementById("vr-cantidad").value || 1);

    if (!descripcion || !monto || !categoria) {
        alert("Completa todos los campos");
        return;
    }

    carrito.push({
        id_producto: null,
        nombre: descripcion,
        descripcion_manual: descripcion,
        id_categoria: categoria,   
        precio_unitario: monto,
        cantidad,
        es_manual: true
    });

    renderizar();
    cerrarModalVentaRapida();
}

const modalMovimiento = new bootstrap.Modal(document.getElementById('modalMovimiento'));

document.getElementById('btn-registrar-gasto').onclick = () => {

    document.getElementById('movimiento-concepto').value = '';
    document.getElementById('movimiento-monto').value = '';
    document.getElementById('movimiento-tipo').value = 'egreso';
    document.getElementById('movimiento-metodo').value = 'efectivo';

    modalMovimiento.show();
};

document.getElementById('btn-guardar-movimiento').onclick = async () => {

    const tipo = document.getElementById('movimiento-tipo').value;
    const concepto = document.getElementById('movimiento-concepto').value;
    const monto = parseFloat(document.getElementById('movimiento-monto').value);
    const metodo = document.getElementById('movimiento-metodo').value;

    if (!monto || monto <= 0) {
        return mostrarToast("Monto inválido", "warning");
    }

    try {
        const res = await fetch(`${API_URL}/movimientos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo,
                concepto,
                monto,
                metodo_pago: metodo
            })
        });

        if (!res.ok) throw new Error();

        mostrarToast("Movimiento registrado", "success");
        modalMovimiento.hide();

    } catch {
        mostrarToast("Error al registrar movimiento", "error");
    }
};

document.getElementById('btn-pago-efectivo').onclick = () => procesarVenta('efectivo');
document.getElementById('btn-pago-digital').onclick = () => procesarVenta('transferencia');
document.getElementById('btn-pago-tarjeta').onclick = () => {
    if (carrito.length === 0) {
        return mostrarToast("Carrito vacío", "warning");
    }

    const totalBase = carrito.reduce((acc, item) =>
        acc + (item.precio_unitario * item.cantidad), 0
    );

    const recargo = totalBase * 0.08;
    const totalConRecargo = totalBase + recargo;

    document.getElementById('tarjeta-subtotal').innerText = `$${totalBase.toFixed(2)}`;
    document.getElementById('tarjeta-total-final').innerText = `$${totalConRecargo.toFixed(2)}`;

    modalTarjeta.show();
};

document.getElementById('btn-pago-mixto').onclick = () => {
    if (carrito.length === 0) return mostrarToast("Carrito vacío", "warning");

    const total = carrito.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);

    mixtoTotal.innerText = `$${total.toFixed(2)}`;
    mixtoEfectivo.value = '';
    mixtoTransferencia.innerText = `$${total.toFixed(2)}`;

    modalMixto.show();
};

mixtoEfectivo.addEventListener('input', () => {
    const total = parseFloat(mixtoTotal.innerText.replace('$', '')) || 0;
    const efectivo = parseFloat(mixtoEfectivo.value) || 0;

    const restante = total - efectivo;

    mixtoTransferencia.innerText = `$${(restante > 0 ? restante : 0).toFixed(2)}`;
});

document.getElementById('btn-confirmar-mixto').onclick = () => {
    const total = parseFloat(mixtoTotal.innerText.replace('$', '')) || 0;
    const efectivo = parseFloat(mixtoEfectivo.value) || 0;
    const transferencia = total - efectivo;

    if (efectivo <= 0 || efectivo >= total) {
        return alert("El monto en efectivo debe ser mayor a 0 y menor al total");
    }

    inputPagaCon.value = efectivo;
    window.montoDigitalTemporal = transferencia;

    modalMixto.hide();

    procesarVenta('mixto');
};

document.getElementById('btn-confirmar-peso').onclick = () => {
    const peso = parseFloat(document.getElementById('input-peso-modal').value);
    
    if (peso > 0 && productoPendiente) {
        const i = carrito.findIndex(item => item.id_producto === productoPendiente.id_producto);

        if (i !== -1) {
            carrito[i].cantidad += peso;
        } else {
            carrito.push({
                id_producto: productoPendiente.id_producto,
                nombre: productoPendiente.nombre,
                precio_unitario: parseFloat(productoPendiente.precio_venta),
                cantidad: peso,
                es_pesable: true
            });
        }
        renderizar();
        bootstrap.Modal.getInstance(document.getElementById('modalPeso')).hide();
        productoPendiente = null;
    }
};

document.getElementById('btn-cancelar-peso').onclick = () => {
    productoPendiente = null;
    bootstrap.Modal.getInstance(document.getElementById('modalPeso')).hide();
};

document.getElementById('btn-reimprimir-ultimo').onclick = async () => {
    try {
        const res = await fetch(`${API_URL}/ventas/reimprimir`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        mostrarToast("Ticket reimpreso", "success");

    } catch {
        mostrarToast("Error al reimprimir", "error");
    }
};

document.getElementById('btn-debito').onclick = () => {
    modalTarjeta.hide();
    procesarVenta('tarjeta', 'debito'); 
};

document.getElementById('btn-credito').onclick = () => {
    modalTarjeta.hide();
    procesarVenta('tarjeta', 'credito'); 
};

document.getElementById('btn-logout').onclick = () => { 
    localStorage.clear(); 
    window.location.href = 'login.html'; 
};

document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName !== 'INPUT') inputCodigo.focus();
});

inputCodigo.focus();