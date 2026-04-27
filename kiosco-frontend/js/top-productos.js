const API_URL = window.APP_CONFIG.API_URL;
const token = localStorage.getItem('jwt_token');
const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Usuario';
document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

const tabla = document.getElementById('tabla-top');

async function cargarTop() {
    try {
        const desde = document.getElementById('filtro-desde').value;
        const hasta = document.getElementById('filtro-hasta').value;
        const categoria = document.getElementById('filtro-categoria').value;

        let url = API_URL;
        const params = [];

        if (desde) params.push(`desde=${desde}`);
        if (hasta) params.push(`hasta=${hasta}`);
        if (categoria) params.push(`categoria=${categoria}`);

        if (params.length) {
            url += '?' + params.join('&');
        }

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        renderTabla(data);

    } catch (error) {
        console.error(error);
    }
}

async function cargarCategorias() {
    try {
        const res = await fetch(`${API_URL}/categorias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const categorias = await res.json();

        const select = document.getElementById('filtro-categoria');

        select.innerHTML += categorias.map(c =>
            `<option value="${c.id_categoria}">${c.nombre_categoria}</option>`
        ).join('');

    } catch (error) {
        console.error(error);
    }
}

function renderTabla(data) {
    if (!data.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">
                    Sin datos
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = data.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${p.nombre}</td>
            <td class="fw-bold">${parseInt(p.cantidad)}</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    const d = new Date();
    const hoy = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

    document.getElementById('filtro-desde').value = hoy;
    document.getElementById('filtro-hasta').value = hoy;

    await cargarCategorias(); 
    await cargarTop();
});

document.getElementById('btn-limpiar').addEventListener('click', () => {
    const d = new Date();
    const hoy = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

    document.getElementById('filtro-desde').value = hoy;
    document.getElementById('filtro-hasta').value = hoy;
    document.getElementById('filtro-categoria').value = '';

    cargarTop();
});

document.getElementById('filtro-desde').addEventListener('change', cargarTop);
document.getElementById('filtro-hasta').addEventListener('change', cargarTop);
document.getElementById('filtro-categoria').addEventListener('change', cargarTop);