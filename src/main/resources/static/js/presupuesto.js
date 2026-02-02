// Configuración de Tailwind CSS
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#1773cf",
            }
        },
    },
}

// ─── BASE URLs de los controllers ───────────────────────────────────────────
const API = {
    presupuestos: '/api/presupuestos',
    detalles:     '/api/presupuestos-detalles',
    clientes:     '/api/clientes',
    albergues:    '/api/albergues'
};

// ─── Helper: usa AuthService para mandar el token automáticamente ───────────
async function apiCall(url, options = {}) {
    const res = await AuthService.authenticatedFetch(url, options);

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[${res.status}] ${errText || res.statusText}`);
    }

    return res.status === 204 ? null : res.json();
}

// ─── Estado local ────────────────────────────────────────────────────────────
let presupuestosCache = [];
let modalClientes = [];
let modalAlbergues = [];

// ─── Paginación ──────────────────────────────────────────────────────────────
const ITEMS_POR_PAGINA = 4;
let paginaActual = 1;

// ─── Colores inline para estados ─────────────────────────────────────────────
const ESTADO_STYLES = {
    'Pendiente':  { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    'Enviado':    { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'Aceptado':   { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    'Rechazado':  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
    'Caducado':   { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },
};

function getEstadoStyle(estado) {
    const s = ESTADO_STYLES[estado] || ESTADO_STYLES['Pendiente'];
    return `background-color:${s.bg};color:${s.text};border-color:${s.border};`;
}

// ─── Cargar presupuestos desde el backend ────────────────────────────────────
async function cargarPresupuestos() {
    try {
        presupuestosCache = await apiCall(API.presupuestos);
        paginaActual = 1;
        renderTabla();
        renderPaginacion();
    } catch (err) {
        console.error('Error cargando presupuestos:', err);
        mostrarToast('No se pudieron cargar los presupuestos.', 'error');
    }
}

// ─── Renderizar tabla según página actual ───────────────────────────────────
function renderTabla() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const pagina = presupuestosCache.slice(inicio, inicio + ITEMS_POR_PAGINA);

    tbody.innerHTML = '';

    if (pagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="padding:40px 24px;text-align:center;font-size:14px;color:#9ca3af;">
                    No hay presupuestos que mostrar.
                </td>
            </tr>`;
        return;
    }

    pagina.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/50 transition-colors';
        tr.dataset.presupuestoId = p.id;

        const estadoStyle = getEstadoStyle(p.estado);

        let botones = `
            <button aria-label="Editar" data-id="${p.id}"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <span class="material-symbols-outlined text-base">edit</span>
            </button>
            <button aria-label="Eliminar" data-id="${p.id}"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                <span class="material-symbols-outlined text-base">delete</span>
            </button>`;

        if (p.estado !== 'Aceptado' && p.estado !== 'Rechazado' && p.estado !== 'Caducado') {
            botones += `
            <button aria-label="Enviar presupuesto" data-id="${p.id}"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <span class="material-symbols-outlined text-base">mail</span>
            </button>`;
        }

        if (p.estado === 'Enviado' || p.estado === 'Aceptado') {
            botones += `
            <button aria-label="Convertir en Reserva" data-id="${p.id}"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <span class="material-symbols-outlined text-base">bookmark_add</span>
            </button>`;
        }

        // Columnas: Cliente | Fecha Viaje | Origen y Destino | KM Est. | Precio | Fecha Creación | Estado | Acciones
        tr.innerHTML = `
            <td class="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">${p.cliente?.nombre || '—'}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${formatFecha(p.fechaViaje)}</td>
            <td class="px-6 py-5 text-sm text-gray-600">${p.origen || '—'} - ${p.destino || '—'}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${p.kilometrosEstimados ? p.kilometrosEstimados + ' km' : '—'}</td>
            <td class="px-6 py-5 text-right whitespace-nowrap text-sm font-bold text-gray-900">${formatPrecio(p.precioTotal)}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${formatFecha(p.fechaCreacion)}</td>
            <td class="px-6 py-5 whitespace-nowrap">
                <span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;border:1px solid;${estadoStyle}">
                    ${p.estado}
                </span>
            </td>
            <td class="px-6 py-5 whitespace-nowrap">
                <div class="flex items-center gap-2">${botones}</div>
            </td>`;

        tbody.appendChild(tr);
    });

    adjuntarEventosTabla();
}

// ─── Paginación dinámica ─────────────────────────────────────────────────────
function renderPaginacion() {
    const contenedor = document.querySelector('.flex.items-center.gap-1');
    if (!contenedor) return;

    const totalPaginas = Math.ceil(presupuestosCache.length / ITEMS_POR_PAGINA);

    if (totalPaginas <= 1) {
        contenedor.style.display = 'none';
        return;
    }
    contenedor.style.display = 'flex';
    contenedor.innerHTML = '';

    contenedor.insertAdjacentHTML('beforeend', `
        <button class="flex items-center justify-center h-8 w-8 rounded text-gray-400 hover:bg-gray-50 transition-colors" data-nav="prev">
            <span class="material-symbols-outlined text-xl">chevron_left</span>
        </button>`);

    getPaginasVisibles(paginaActual, totalPaginas).forEach(p => {
        if (p === '...') {
            contenedor.insertAdjacentHTML('beforeend',
                `<span class="flex items-center justify-center h-8 w-8 text-gray-600">...</span>`);
        } else {
            const activo = p === paginaActual;
            contenedor.insertAdjacentHTML('beforeend', `
                <button class="flex items-center justify-center h-8 w-8 rounded text-sm transition-colors font-medium text-gray-600 hover:bg-gray-50"
                    style="${activo ? 'background-color:#1773cf;color:#fff;font-weight:700;' : ''}"
                    data-page="${p}">${p}</button>`);
        }
    });

    contenedor.insertAdjacentHTML('beforeend', `
        <button class="flex items-center justify-center h-8 w-8 rounded text-gray-400 hover:bg-gray-50 transition-colors" data-nav="next">
            <span class="material-symbols-outlined text-xl">chevron_right</span>
        </button>`);

    contenedor.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            paginaActual = parseInt(btn.dataset.page);
            renderTabla();
            renderPaginacion();
        });
    });
    contenedor.querySelector('[data-nav="prev"]').addEventListener('click', () => {
        if (paginaActual > 1) { paginaActual--; renderTabla(); renderPaginacion(); }
    });
    contenedor.querySelector('[data-nav="next"]').addEventListener('click', () => {
        if (paginaActual < totalPaginas) { paginaActual++; renderTabla(); renderPaginacion(); }
    });
}

function getPaginasVisibles(actual, total) {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const paginas = [1];
    if (actual > 3) paginas.push('...');
    for (let i = Math.max(2, actual - 1); i <= Math.min(total - 1, actual + 1); i++) paginas.push(i);
    if (actual < total - 2) paginas.push('...');
    paginas.push(total);
    return paginas;
}

// ─── Formateo fecha → "22/08/2024" ──────────────────────────────────────────
function formatFecha(isoDate) {
    if (!isoDate) return '—';
    const d   = new Date(isoDate);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// ─── Formateo precio → "€45.00" ─────────────────────────────────────────────
function formatPrecio(precio) {
    if (precio == null) return '—';
    return '€' + precio.toFixed(2);
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function mostrarToast(msg, tipo = 'error') {
    document.querySelector('.toast-notif')?.remove();

    const colores = {
        error:   { bg: '#fef2f2',   text: '#b91c1c', border: '#fecaca' },
        success: { bg: '#f0fdf4',   text: '#15803d', border: '#bbf7d0' },
        info:    { bg: '#eff6ff',   text: '#1d4ed8', border: '#bfdbfe' }
    };
    const iconos = { error: 'error', success: 'check_circle', info: 'info' };
    const c = colores[tipo];

    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:100;
        display:flex;align-items:center;gap:12px;
        padding:14px 20px;border-radius:12px;
        border:1px solid ${c.border};
        background-color:${c.bg};color:${c.text};
        font-size:14px;font-weight:500;
        box-shadow:0 4px 12px rgba(0,0,0,0.1);
        animation:toastIn 0.3s ease forwards;`;

    toast.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:20px;">${iconos[tipo]}</span>
        <span>${msg}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─── Modal crear / editar presupuesto ────────────────────────────────────────
function crearModal(modo, presupuestoEditar = null) {
    document.querySelector('.modal-overlay')?.remove();

    const estadoOpciones = ['Pendiente', 'Enviado', 'Aceptado', 'Rechazado', 'Caducado']
        .map(e => {
            let selected = '';
            if (modo === 'editar' && presupuestoEditar?.estado === e) selected = 'selected';
            if (modo === 'crear' && e === 'Pendiente') selected = 'selected';
            return `<option value="${e}" ${selected}>${e}</option>`;
        })
        .join('');

    const clienteOpciones = modalClientes
        .map(c => {
            const selected = presupuestoEditar?.cliente?.id === c.id ? 'selected' : '';
            return `<option value="${c.id}" ${selected}>${c.nombre}</option>`;
        })
        .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:520px;margin:0 16px;overflow:hidden;animation:modalIn 0.25s ease forwards;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">${modo === 'crear' ? 'Nuevo Presupuesto' : 'Editar Presupuesto'}</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>

            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px;max-height:65vh;overflow-y:auto;">
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Cliente</label>
                    <select id="modal-cliente" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="" disabled>Selecciona un cliente</option>
                        ${clienteOpciones}
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Fecha de Viaje</label>
                    <input type="date" id="modal-fecha-viaje"
                        value="${presupuestoEditar ? formatDateInput(presupuestoEditar.fechaViaje) : ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Origen</label>
                    <input type="text" id="modal-origen" placeholder="Ej. Aeropuerto T4"
                        value="${presupuestoEditar?.origen || ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Destino</label>
                    <input type="text" id="modal-destino" placeholder="Ej. Hotel Ritz"
                        value="${presupuestoEditar?.destino || ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div style="display:flex;gap:16px;">
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">KM Estimados</label>
                        <input type="number" id="modal-km" min="0" placeholder="0"
                            value="${presupuestoEditar?.kilometrosEstimados || ''}"
                            style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Precio Total (€)</label>
                        <input type="number" id="modal-precio" step="0.01" min="0" placeholder="0.00"
                            value="${presupuestoEditar?.precioTotal ?? ''}"
                            style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                    </div>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Observaciones</label>
                    <textarea id="modal-observaciones" rows="3" placeholder="Notas adicionales..."
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">${presupuestoEditar?.observaciones || ''}</textarea>
                </div>
                ${modo === 'editar' ? `
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Estado</label>
                    <select id="modal-estado" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        ${estadoOpciones}
                    </select>
                </div>` : ''}
            </div>

            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #f3f4f6;background:#f9fafb;">
                <button class="modal-close" style="padding:8px 16px;border-radius:8px;border:none;background:transparent;font-size:14px;font-weight:500;color:#4b5563;cursor:pointer;">Cancelar</button>
                <button id="modal-submit" style="padding:8px 20px;border-radius:8px;border:none;background:#1773cf;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    ${modo === 'crear' ? 'Crear Presupuesto' : 'Guardar Cambios'}
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));
    overlay.querySelector('#modal-submit').addEventListener('click', () => handleModalSubmit(modo, presupuestoEditar));
}

function formatDateInput(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toISOString().split('T')[0];
}

// ─── Submit modal crear/editar ───────────────────────────────────────────────
async function handleModalSubmit(modo, presupuestoEditar) {
    const clienteId    = document.getElementById('modal-cliente')?.value;
    const fechaViaje   = document.getElementById('modal-fecha-viaje')?.value;
    const origen       = document.getElementById('modal-origen')?.value.trim();
    const destino      = document.getElementById('modal-destino')?.value.trim();
    const km           = document.getElementById('modal-km')?.value;
    const precio       = document.getElementById('modal-precio')?.value;
    const observaciones= document.getElementById('modal-observaciones')?.value.trim();

    if (!clienteId || !origen || !destino) {
        mostrarToast('Cliente, origen y destino son obligatorios.', 'error');
        return;
    }

    try {
        if (modo === 'crear') {
            const nuevoPresupuesto = {
                cliente: { id: parseInt(clienteId) },
                fechaViaje: fechaViaje ? new Date(fechaViaje).toISOString() : null,
                origen,
                destino,
                kilometrosEstimados: km ? parseInt(km) : null,
                precioTotal: precio ? parseFloat(precio) : 0,
                observaciones: observaciones || null,
                estado: 'Pendiente',
                fechaCreacion: new Date().toISOString()
            };

            await apiCall(API.presupuestos, {
                method: 'POST',
                body: JSON.stringify(nuevoPresupuesto)
            });

            document.querySelector('.modal-overlay')?.remove();
            mostrarToast('Presupuesto creado correctamente.', 'success');
            await cargarPresupuestos();

        } else {
            const presupuestoActualizado = {
                ...presupuestoEditar,
                cliente: { id: parseInt(clienteId) },
                fechaViaje: fechaViaje ? new Date(fechaViaje).toISOString() : presupuestoEditar.fechaViaje,
                origen,
                destino,
                kilometrosEstimados: km ? parseInt(km) : null,
                precioTotal: precio ? parseFloat(precio) : 0,
                observaciones: observaciones || null,
                estado: document.getElementById('modal-estado')?.value || presupuestoEditar.estado
            };

            await apiCall(`${API.presupuestos}/${presupuestoEditar.id}`, {
                method: 'PUT',
                body: JSON.stringify(presupuestoActualizado)
            });

            document.querySelector('.modal-overlay')?.remove();
            mostrarToast('Presupuesto actualizado correctamente.', 'success');
            await cargarPresupuestos();
        }
    } catch (err) {
        console.error('Error en modal submit:', err);
        mostrarToast(err.message, 'error');
    }
}

// ─── Eventos de botones en cada fila ─────────────────────────────────────────
function adjuntarEventosTabla() {

    // EDITAR
    document.querySelectorAll('button[aria-label="Editar"]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const presupuesto = presupuestosCache.find(p => p.id == this.dataset.id);
            if (!presupuesto) return;

            if (modalClientes.length === 0) {
                try { modalClientes = await apiCall(API.clientes); }
                catch (e) { mostrarToast('No se pudieron cargar los clientes.', 'error'); return; }
            }

            crearModal('editar', presupuesto);
        });
    });

    // ELIMINAR
    document.querySelectorAll('button[aria-label="Eliminar"]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const presupuesto = presupuestosCache.find(p => p.id == this.dataset.id);
            const nombre = presupuesto?.cliente?.nombre || `Presupuesto #${this.dataset.id}`;

            if (!confirm(`¿Estás seguro de que deseas eliminar el presupuesto de ${nombre}?`)) return;

            try {
                await apiCall(`${API.presupuestos}/${this.dataset.id}`, { method: 'DELETE' });
                mostrarToast(`Presupuesto de ${nombre} eliminado.`, 'success');
                await cargarPresupuestos();
            } catch (err) {
                mostrarToast(err.message, 'error');
            }
        });
    });

    // ENVIAR PRESUPUESTO
document.querySelectorAll('button[aria-label="Enviar presupuesto"]').forEach(btn => {
    btn.addEventListener('click', async function () {
        const presupuesto = presupuestosCache.find(p => p.id == this.dataset.id);
        const nombre = presupuesto?.cliente?.nombre || `Presupuesto #${this.dataset.id}`;

        if (!confirm(`¿Enviar presupuesto por email a ${nombre}?`)) return;

        try {
            // Llamar al endpoint de envío CON AuthService
            await apiCall(`${API.presupuestos}/${this.dataset.id}/enviar`, {
                method: 'POST'
            });

            mostrarToast(`Presupuesto enviado por email a ${nombre}.`, 'success');
            await cargarPresupuestos();
        } catch (err) {
            console.error('Error enviando presupuesto:', err);
            mostrarToast(err.message, 'error');
        }
    });
})

    // CONVERTIR EN RESERVA
    document.querySelectorAll('button[aria-label="Convertir en Reserva"]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const presupuesto = presupuestosCache.find(p => p.id == this.dataset.id);
            const nombre = presupuesto?.cliente?.nombre || `Presupuesto #${this.dataset.id}`;

            if (!confirm(`¿Convertir el presupuesto de ${nombre} en una reserva?`)) return;

            try {
                // Actualizar estado a Aceptado
                const actualizado = { ...presupuesto, estado: 'Aceptado' };
                await apiCall(`${API.presupuestos}/${this.dataset.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(actualizado)
                });

                mostrarToast(`Presupuesto de ${nombre} convertido en reserva.`, 'success');
                await cargarPresupuestos();
            } catch (err) {
                mostrarToast(err.message, 'error');
            }
        });
    });
}

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {

    // Verificar autenticación
    if (!AuthService.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Botón crear nuevo presupuesto
    const createBtn = document.getElementById('createBudgetBtn');
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            if (modalClientes.length === 0) {
                try { modalClientes = await apiCall(API.clientes); }
                catch (e) { mostrarToast('No se pudieron cargar los clientes.', 'error'); return; }
            }
            crearModal('crear');
        });
    }

    await cargarPresupuestos();

    console.log('Taxicamino - Sistema de gestión de presupuestos conectado a la API.');
});

document.querySelector('a[href="#"]')?.addEventListener('click', async (e) => {
    e.preventDefault();

    if (modalClientes.length === 0) {
        try { modalClientes = await apiCall(API.clientes); }
        catch (err) { mostrarToast('No se pudieron cargar los clientes.', 'error'); return; }
    }

    mostrarModalSeleccionarCliente();
});

function mostrarModalSeleccionarCliente() {
    // Modal simple para elegir cliente
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;';

    const opciones = modalClientes.map(c =>
        `<button onclick="filtrarPorCliente(${c.id})" style="width:100%;text-align:left;padding:12px 16px;border-bottom:1px solid #e5e7eb;hover:background:#f9fafb;cursor:pointer;">${c.nombre}</button>`
    ).join('');

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:400px;max-height:500px;overflow:hidden;">
            <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                <h3 style="font-size:18px;font-weight:700;">Selecciona un cliente</h3>
            </div>
            <div style="overflow-y:auto;max-height:400px;">${opciones}</div>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function filtrarPorCliente(clienteId) {
    document.querySelector('.modal-overlay')?.remove();

    const filtrados = presupuestosCache.filter(p => p.cliente?.id === clienteId);

    if (filtrados.length === 0) {
        mostrarToast('Este cliente no tiene presupuestos.', 'info');
        return;
    }

    // Guardar cache original y mostrar solo los filtrados
    const cacheOriginal = [...presupuestosCache];
    presupuestosCache = filtrados;
    paginaActual = 1;
    renderTabla();
    renderPaginacion();

    // Botón para volver a ver todos
    const header = document.querySelector('main > div:first-child');
    const btnVolver = document.createElement('button');
    btnVolver.id = 'btnVolverTodos';
    btnVolver.className = 'px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors';
    btnVolver.textContent = '← Ver todos los presupuestos';
    btnVolver.onclick = () => {
        presupuestosCache = cacheOriginal;
        paginaActual = 1;
        renderTabla();
        renderPaginacion();
        btnVolver.remove();
    };
    header.appendChild(btnVolver);

    mostrarToast(`Mostrando ${filtrados.length} presupuesto(s) del cliente.`, 'info');
}

// Exponer globalmente
window.filtrarPorCliente = filtrarPorCliente;