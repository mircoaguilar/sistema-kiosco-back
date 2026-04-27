(function verificarSesion() {
    if (!localStorage.getItem('jwt_token')) {
        window.location.href = 'login.html';
    }
})();

const API_URL = window.APP_CONFIG.API_URL;
const token = localStorage.getItem('jwt_token');
const nombreUsuario = localStorage.getItem('nombre_usuario') || 'Usuario';

document.getElementById('nombre-vendedor').innerText = `Vendedor: ${nombreUsuario}`;

const tabla = document.getElementById('tabla-proveedores');
const form = document.getElementById('form-proveedor');
const modal = new bootstrap.Modal(document.getElementById('modalProveedor'));

let proveedores = [];

async function cargarProveedores() {
    try {
        const res = await fetch(`${API_URL}/proveedores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        proveedores = await res.json();
        renderTabla(proveedores);

    } catch (error) {
        console.error("Error cargando proveedores:", error);
    }
}

function renderTabla(data) {
    tabla.innerHTML = '';

    if (data.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    No hay proveedores cargados
                </td>
            </tr>`;
        return;
    }

    tabla.innerHTML = data.map(p => `
        <tr>
            <td class="fw-bold">${p.nombre}</td>
            <td>${p.telefono || '-'}</td>
            <td>${p.email || '-'}</td>
            <td>${p.direccion || '-'}</td>

            <td class="text-center">
                <div class="btn-group shadow-sm border rounded overflow-hidden">
                    
                    <button class="btn btn-acciones text-primary border-end"
                        onclick="editar(${p.id_proveedor})"
                        title="Editar">
                        <i class="bi bi-pencil-fill"></i>
                    </button>

                    <button class="btn btn-acciones text-danger"
                        onclick="eliminar(${p.id_proveedor})"
                        title="Eliminar">
                        <i class="bi bi-trash3-fill"></i>
                    </button>

                </div>
            </td>
        </tr>
    `).join('');
}

document.getElementById('buscar-proveedor').addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();

    const filtrados = proveedores.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        (p.telefono || '').toLowerCase().includes(texto)
    );

    renderTabla(filtrados);
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('id_proveedor').value;

    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const email = document.getElementById('email').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    limpiarErrores();

    if (nombre.length < 3) {
        return mostrarToast("El nombre debe tener al menos 3 caracteres", "warning");
    }

    if (telefono && !/^[0-9]+$/.test(telefono)) {
        return mostrarToast("El teléfono solo debe contener números", "warning");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return mostrarToast("Email inválido", "warning");
    }

    const data = { nombre, telefono, email, direccion };

    try {
        let res;

        if (id) {
           res = await fetch(`${API_URL}/proveedores/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
        } else {
            res = await fetch(`${API_URL}/proveedores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
        }

        if (res.ok) {
            modal.hide();
            form.reset();
            document.getElementById('id_proveedor').value = '';

            mostrarToast(
                id ? "Proveedor actualizado correctamente" : "Proveedor creado correctamente",
                "success"
            );

            cargarProveedores();

        } else {
            const err = await res.json();
            mostrarToast(err.error || "Error al guardar", "danger");
        }

    } catch (error) {
        mostrarToast("Error de conexión con el servidor", "danger");
    }
});

function marcarError(input) {
    input.classList.add('is-invalid');
}

function limpiarErrores() {
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

window.editar = function(id) {
    const p = proveedores.find(x => x.id_proveedor == id);

    document.getElementById('id_proveedor').value = p.id_proveedor;
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('telefono').value = p.telefono || '';
    document.getElementById('email').value = p.email || '';
    document.getElementById('direccion').value = p.direccion || '';

    modal.show();
}

window.eliminar = async function(id) {
    if (!confirm("¿Eliminar proveedor?")) return;

    mostrarToast("Proveedor eliminado", "success");

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            cargarProveedores();
        } else {
            alert("Error al eliminar");
        }

    } catch (error) {
        alert("Error de conexión");
    }
}

function mostrarToast(mensaje, tipo = 'success') {
    const toastEl = document.getElementById('toastCaja');
    const toastMensaje = document.getElementById('toastMensaje');

    toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
    toastMensaje.innerText = mensaje;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

cargarProveedores();