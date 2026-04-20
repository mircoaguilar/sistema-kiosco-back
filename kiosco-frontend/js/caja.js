(function verificarSesion() {
    if (!localStorage.getItem('jwt_token')) window.location.href = 'login.html';
})();

const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('jwt_token');
const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Cajero'; 

let idSesionActiva = null;
let efectivoEsperadoGlobal = 0; 

const modalApertura = new bootstrap.Modal(document.getElementById('modalAbrirCaja'));
const modalCerrar = new bootstrap.Modal(document.getElementById('modalCerrarCaja'));

const badgeEstado = document.getElementById('badge-estado-caja');
const btnCerrar = document.getElementById('btn-cerrar-caja');
document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

async function verificarEstadoCaja() {
    try {
        const res = await fetch(`${API_URL}/caja/estado-actual`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.abierta) {
            badgeEstado.innerText = "CAJA CERRADA";
            badgeEstado.className = "badge bg-danger px-3 py-2";
            btnCerrar.disabled = true;
            btnCerrar.innerText = "ESPERANDO APERTURA...";
            modalApertura.show(); 
            return;
        }

        idSesionActiva = data.id_sesion;
        efectivoEsperadoGlobal = parseFloat(data.efectivo_esperado);
        
        badgeEstado.innerText = "CAJA ABIERTA";
        badgeEstado.className = "badge bg-success px-3 py-2";
        btnCerrar.disabled = false;
        btnCerrar.innerText = "REALIZAR CIERRE DE CAJA";

        document.getElementById('monto-inicial').innerText = formatear(data.monto_inicial);
        document.getElementById('monto-ventas').innerText = formatear(data.ventas_efectivo);
        document.getElementById('monto-digital').innerText = formatear(data.ventas_digital);
        document.getElementById('monto-ingresos').innerText = formatear(data.total_ingresos);
        document.getElementById('monto-gastos').innerText = formatear(data.total_egresos);
        document.getElementById('monto-esperado').innerText = formatear(data.efectivo_esperado);

        pintarMovimientos(data.movimientos);

    } catch (error) {
        console.error("Error:", error);
        badgeEstado.innerText = "ERROR DE CONEXIÓN";
    }
}

document.getElementById('formAbrirCaja').addEventListener('submit', async (e) => {
    e.preventDefault();
    const monto = document.getElementById('monto_inicial_input').value;

    try {
        const res = await fetch(`${API_URL}/caja/abrir`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ monto_inicial: monto })
        });

        if (res.ok) {
            modalApertura.hide();
            verificarEstadoCaja(); 
        } else {
            const err = await res.json();
            alert(err.msg || "Error al abrir caja");
        }
    } catch (error) {
        alert("Error de servidor");
    }
});

btnCerrar.addEventListener('click', () => {
    document.getElementById('monto_real_input').value = '';
    document.getElementById('display-diferencia').style.display = 'none';
    modalCerrar.show();
});

document.getElementById('monto_real_input').addEventListener('input', (e) => {
    const real = parseFloat(e.target.value) || 0;
    const dif = real - efectivoEsperadoGlobal;
    const display = document.getElementById('display-diferencia');
    
    display.style.display = 'block';
    if (Math.abs(dif) < 0.01) {
        display.innerHTML = `<span class="text-success">Caja exacta</span>`;
    } else if (dif < 0) {
        display.innerHTML = `<span class="text-danger">Faltante: ${formatear(Math.abs(dif))}</span>`;
    } else {
        display.innerHTML = `<span class="text-primary">Sobrante: ${formatear(dif)}</span>`;
    }
});

document.getElementById('formCerrarCaja').addEventListener('submit', async (e) => {
    e.preventDefault();
    const montoReal = parseFloat(document.getElementById('monto_real_input').value);

    try {
        const res = await fetch(`${API_URL}/caja/cerrar`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                id_sesion: idSesionActiva,
                monto_final_efectivo: montoReal
            })
        });

        const data = await res.json();
        if (res.ok) {
            modalCerrar.hide();

            let msg = 'Caja cerrada correctamente';
            const dif = data.detalle.diferencia;

            if (Math.abs(dif) > 0.01) {
                msg += dif > 0
                    ? ` (Sobrante: ${formatear(dif)})`
                    : ` (Faltante: ${formatear(Math.abs(dif))})`;
            }

            mostrarToast(msg);

            setTimeout(() => {
                location.reload();
            }, 4000);
        } else {
            alert(data.error || "Error al cerrar");
        }
    } catch (e) { 
        alert("Error de conexión al cerrar"); 
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

function pintarMovimientos(movimientos) {
    const tabla = document.getElementById('tabla-movimientos');
    tabla.innerHTML = '';
    
    if (!movimientos || movimientos.length === 0) {
        tabla.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No hay movimientos en esta sesión</td></tr>';
        return;
    }

    movimientos.forEach(m => {
        const esEgreso = m.tipo === 'egreso';
        const esIngreso = m.tipo === 'ingreso';
        const esVenta = m.tipo === 'venta';

        let badgeTipo = '';
        let textoTipo = '';

        if (esEgreso) {
            badgeTipo = 'bg-danger-subtle text-danger';
            textoTipo = 'Gasto';
        } else if (esIngreso) {
            badgeTipo = 'bg-primary-subtle text-primary';
            textoTipo = 'Ingreso';
        } else {
            badgeTipo = 'bg-success-subtle text-success';
            textoTipo = 'Venta';
        }

        let badgeMedio = '';
        let textoMedio = '';

        if (m.medio === 'efectivo') {
            badgeMedio = 'bg-success-subtle text-success';
            textoMedio = 'Efectivo';
        } else {
            badgeMedio = 'bg-info-subtle text-info';
            textoMedio = 'Transferencia/QR';
        }

        tabla.innerHTML += `
        <tr>
            <td class="ps-3 text-muted small">
                ${new Date(m.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </td>

            <td class="fw-bold">${m.descripcion}</td>

            <td>
                <span class="badge ${badgeTipo}">
                    ${textoTipo}
                </span>
            </td>

            <td>
                <span class="badge ${badgeMedio}">
                    ${textoMedio}
                </span>
            </td>

            <td class="text-end pe-3 fw-bold ${esEgreso ? 'text-danger' : ''}">
                ${esEgreso ? '-' : ''}${formatear(m.monto)}
            </td>
        </tr>`;
    });
}

function mostrarToast(mensaje, tipo = 'success') {
    const toastEl = document.getElementById('toastCaja');
    const toastMensaje = document.getElementById('toastMensaje');

    toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
    toastMensaje.innerText = mensaje;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function formatear(n) {
    return `$${parseFloat(n).toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
}

verificarEstadoCaja();