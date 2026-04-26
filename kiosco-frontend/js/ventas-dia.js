(function verificarSesion() {
    if (!localStorage.getItem('jwt_token')) {
        window.location.href = 'login.html';
    }
})();

const API_URL = 'https://sistema-kiosco.onrender.com/api/reportes/productos-dia';
const BASE_API = 'https://sistema-kiosco.onrender.com/api';

const token = localStorage.getItem('jwt_token');
const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Usuario';

document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

const tabla = document.getElementById('tabla-reporte');
const totalDiaHTML = document.getElementById('total-dia');

async function cargarFiltros() {
    try {
        const [catRes, provRes] = await Promise.all([
            fetch(`${BASE_API}/categorias`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${BASE_API}/proveedores`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const categorias = await catRes.json();
        const proveedores = await provRes.json();

        const selectCat = document.getElementById('filtro-categoria');
        const selectProv = document.getElementById('filtro-proveedor');

        selectCat.innerHTML += categorias.map(c => 
            `<option value="${c.id_categoria}">${c.nombre_categoria}</option>`
        ).join('');

        selectProv.innerHTML += proveedores.map(p => 
            `<option value="${p.id_proveedor}">${p.nombre}</option>`
        ).join('');

    } catch (error) {
        console.error(error);
    }
}

async function cargarReporte() {
    try {
        const desde = document.getElementById('filtro-desde').value;
        const hasta = document.getElementById('filtro-hasta').value;
        const categoria = document.getElementById('filtro-categoria').value;
        const proveedor = document.getElementById('filtro-proveedor').value;

        let url = API_URL;
        const params = [];

        if (categoria) params.push(`categoria=${categoria}`);
        if (proveedor) params.push(`proveedor=${proveedor}`);
        if (desde) params.push(`desde=${desde}`);
        if (hasta) params.push(`hasta=${hasta}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        renderTabla(data.productos);
        renderResumen(data.resumen);

    } catch (error) {
        console.error(error);

        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    Error al cargar el reporte
                </td>
            </tr>
        `;
    }
}

function renderTabla(productos) {
    if (!productos || productos.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    No hay ventas registradas
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = productos.map(p => `
        <tr>
            <td class="fw-bold">${p.nombre}</td>
            <td>${p.categoria || '-'}</td>
            <td>${p.proveedor || '-'}</td>
            <td>${parseFloat(p.cantidad)}</td>
            <td class="fw-bold text-success">$${parseFloat(p.total).toFixed(2)}</td>
        </tr>
    `).join('');
}

function renderResumen(resumen) {
    if (!resumen) return;

    totalDiaHTML.innerText = `$${parseFloat(resumen.total_dia).toFixed(2)}`;

    const ventasHTML = document.getElementById('cantidad-ventas');
    if (ventasHTML) {
        ventasHTML.innerText = resumen.cantidad_ventas || 0;
    }
}

document.getElementById('btn-limpiar').addEventListener('click', () => {
    document.getElementById('filtro-categoria').value = '';
    document.getElementById('filtro-proveedor').value = '';

    const d = new Date();
    const hoy = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

    document.getElementById('filtro-desde').value = hoy;
    document.getElementById('filtro-hasta').value = hoy;

    cargarReporte();
});

document.getElementById('filtro-categoria').addEventListener('change', cargarReporte);
document.getElementById('filtro-proveedor').addEventListener('change', cargarReporte);
document.getElementById('filtro-desde').addEventListener('change', cargarReporte);
document.getElementById('filtro-hasta').addEventListener('change', cargarReporte);

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

document.addEventListener('DOMContentLoaded', async () => {
    const d = new Date();
    const hoy = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

    document.getElementById('filtro-desde').value = hoy;
    document.getElementById('filtro-hasta').value = hoy;

    await cargarFiltros();
    await cargarReporte();
});