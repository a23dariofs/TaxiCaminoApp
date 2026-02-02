// ─── BASE URLs de los controllers ───────────────────────────────────────────
const API = {
    clientes:     '/api/clientes',
    reservas:     '/api/reservas',
    repartidores: '/api/repartidores'
};

// ─── Helper: usa AuthService para mandar el token automáticamente ───────────
// AuthService.authenticatedFetch() ya añade el header Authorization: Bearer {token}
// y redirige al login si el token es inválido o expirado.
async function apiCall(url, options = {}) {
    const res = await AuthService.authenticatedFetch(url, options);

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[${res.status}] ${errText || res.statusText}`);
    }

    return res.status === 204 ? null : res.json();
}

// ─── Estado local ────────────────────────────────────────────────────────────
let reservasCache = [];
let modalClientes = [];

// ─── Paginación ──────────────────────────────────────────────────────────────
const ITEMS_POR_PAGINA = 4;
let paginaActual = 1;

// ─── Colores inline para estados ─────────────────────────────────────────────
// Tailwind CDN no genera clases inyectadas por JS, así que se usan styles inline.
const ESTADO_STYLES = {
    'Pendiente':  { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
    'Confirmada': { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    'En curso':   { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    'Completada': { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' },
    'Cancelada':  { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

function getEstadoStyle(estado) {
    const s = ESTADO_STYLES[estado] || ESTADO_STYLES['Completada'];
    return `background-color:${s.bg};color:${s.text};border-color:${s.border};`;
}

// ─── Cargar reservas desde el backend ────────────────────────────────────────
async function cargarReservas() {
    try {
        reservasCache = await apiCall(API.reservas);
        paginaActual = 1;
        renderTabla();
        renderPaginacion();
    } catch (err) {
        console.error('Error cargando reservas:', err);
        mostrarToast('No se pudieron cargar las reservas.', 'error');
    }
}

// ─── Renderizar tabla según página actual ───────────────────────────────────
function renderTabla() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const pagina = reservasCache.slice(inicio, inicio + ITEMS_POR_PAGINA);

    tbody.innerHTML = '';

    if (pagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="padding:40px 24px;text-align:center;font-size:14px;color:#9ca3af;">
                    No hay reservas que mostrar.
                </td>
            </tr>`;
        return;
    }

    pagina.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/50 transition-colors';
        tr.dataset.reservaId = r.id;

        const estadoStyle = getEstadoStyle(r.estado);
        const precio = r.estado === 'Cancelada'
            ? `<span style="text-decoration:line-through;color:#9ca3af;">${formatPrecio(r.precio)}</span>`
            : `<span style="color:#111827;">${formatPrecio(r.precio)}</span>`;

        let botones = `
            <button aria-label="Editar" data-id="${r.id}"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <span class="material-symbols-outlined text-base">edit</span>
            </button>`;

        if (r.estado !== 'Cancelada') {
            botones += `
            <button aria-label="Cancelar" data-id="${r.id}"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                <span class="material-symbols-outlined text-base">cancel</span>
            </button>
            <button aria-label="Pasar a Ruta Diaria" data-id="${r.id}"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <span class="material-symbols-outlined text-base">route</span>
            </button>`;
        }

        tr.innerHTML = `
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${formatFechaHora(r.fechaReserva)}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">${r.cliente?.nombre || '—'}</td>
            <td class="px-6 py-5 text-sm text-gray-600">${r.origen || '—'} - ${r.destino || '—'}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${r.pasajeros ?? '—'}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${r.necesidades || '-'}</td>
            <td class="px-6 py-5 text-right whitespace-nowrap text-sm font-bold">${precio}</td>
            <td class="px-6 py-5 whitespace-nowrap">
                <span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;border:1px solid;${estadoStyle}">
                    ${r.estado}
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

    const totalPaginas = Math.ceil(reservasCache.length / ITEMS_POR_PAGINA);

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

// ─── Formateo fecha → "22/08/2024 10:00" ────────────────────────────────────
function formatFechaHora(isoDate) {
    if (!isoDate) return '—';
    const d   = new Date(isoDate);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

// ─── Modal crear / editar reserva ────────────────────────────────────────────
function crearModal(modo, reservaEditar = null) {
    document.querySelector('.modal-overlay')?.remove();

    const estadoOpciones = ['Pendiente', 'Confirmada', 'En curso', 'Completada', 'Cancelada']
        .map(e => {
            let selected = '';
            if (modo === 'editar' && reservaEditar?.estado === e) selected = 'selected';
            if (modo === 'crear' && e === 'Pendiente') selected = 'selected';
            return `<option value="${e}" ${selected}>${e}</option>`;
        })
        .join('');

    const clienteOpciones = modalClientes
        .map(c => {
            const selected = reservaEditar?.cliente?.id === c.id ? 'selected' : '';
            return `<option value="${c.id}" ${selected}>${c.nombre}</option>`;
        })
        .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:448px;margin:0 16px;overflow:hidden;animation:modalIn 0.25s ease forwards;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">${modo === 'crear' ? 'Nueva Reserva' : 'Editar Reserva'}</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>

            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px;max-height:60vh;overflow-y:auto;">
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Cliente</label>
                    <select id="modal-cliente" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="" disabled>Selecciona un cliente</option>
                        ${clienteOpciones}
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Fecha y Hora</label>
                    <input type="datetime-local" id="modal-fecha"
                        value="${reservaEditar ? formatDatetimeLocal(reservaEditar.fechaReserva) : ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Origen</label>
                    <input type="text" id="modal-origen" placeholder="Ej. Aeropuerto T4"
                        value="${reservaEditar?.origen || ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Destino</label>
                    <input type="text" id="modal-destino" placeholder="Ej. Hotel Ritz"
                        value="${reservaEditar?.destino || ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div style="display:flex;gap:16px;">
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Pasajeros</label>
                        <input type="number" id="modal-pasajeros" min="1" placeholder="1"
                            value="${reservaEditar?.pasajeros || ''}"
                            style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Precio (€)</label>
                        <input type="number" id="modal-precio" step="0.01" min="0" placeholder="0.00"
                            value="${reservaEditar?.precio ?? ''}"
                            style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                    </div>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Necesidades</label>
                    <input type="text" id="modal-necesidades" placeholder="Ej. Silla bebé"
                        value="${reservaEditar?.necesidades || ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
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
                    ${modo === 'crear' ? 'Crear Reserva' : 'Guardar Cambios'}
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));
    overlay.querySelector('#modal-submit').addEventListener('click', () => handleModalSubmit(modo, reservaEditar));
}

function formatDatetimeLocal(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toISOString().slice(0, 16);
}

// ─── Submit modal crear/editar ───────────────────────────────────────────────
async function handleModalSubmit(modo, reservaEditar) {
    const clienteId   = document.getElementById('modal-cliente')?.value;
    const fecha       = document.getElementById('modal-fecha')?.value;
    const origen      = document.getElementById('modal-origen')?.value.trim();
    const destino     = document.getElementById('modal-destino')?.value.trim();
    const pasajeros   = document.getElementById('modal-pasajeros')?.value;
    const precio      = document.getElementById('modal-precio')?.value;
    const necesidades = document.getElementById('modal-necesidades')?.value.trim();

    if (!clienteId || !origen || !destino) {
        mostrarToast('Cliente, origen y destino son obligatorios.', 'error');
        return;
    }

    try {
        if (modo === 'crear') {
            const nuevaReserva = {
                fechaReserva: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
                origen,
                destino,
                pasajeros:    pasajeros ? parseInt(pasajeros) : null,
                precio:       precio ? parseFloat(precio) : 0,
                necesidades:  necesidades || null,
                estado:       'Pendiente'
            };

            await apiCall(`${API.reservas}/cliente/${clienteId}`, {
                method: 'POST',
                body: JSON.stringify(nuevaReserva)
            });

            document.querySelector('.modal-overlay')?.remove();
            mostrarToast('Reserva creada correctamente.', 'success');
            await cargarReservas();

        } else {
            const nuevoEstado = document.getElementById('modal-estado')?.value;

            if (nuevoEstado && nuevoEstado !== reservaEditar.estado) {
                await apiCall(`${API.reservas}/${reservaEditar.id}/estado?estado=${encodeURIComponent(nuevoEstado)}`, {
                    method: 'PUT'
                });
            }

            document.querySelector('.modal-overlay')?.remove();
            mostrarToast('Reserva actualizada correctamente.', 'success');
            await cargarReservas();
        }
    } catch (err) {
        console.error('Error en modal submit:', err);
        mostrarToast(err.message, 'error');
    }
}

// ─── Modal asignar repartidor (Ruta Diaria) ─────────────────────────────────
function crearModalRuta(reservaId, nombreCliente, repartidores) {
    document.querySelector('.modal-overlay')?.remove();

    const opciones = repartidores
        .map(r => `<option value="${r.id}">${r.nombre}</option>`)
        .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:384px;margin:0 16px;overflow:hidden;animation:modalIn 0.25s ease forwards;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">Asignar a Ruta Diaria</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>
            <div style="padding:20px 24px;">
                <p style="font-size:14px;color:#6b7280;margin-bottom:16px;">Reserva de <span style="font-weight:600;color:#1f2937;">${nombreCliente}</span></p>
                <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Selecciona el repartidor</label>
                <select id="modal-repartidor" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                    <option value="" disabled selected>Selecciona...</option>
                    ${opciones}
                </select>
            </div>
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #f3f4f6;background:#f9fafb;">
                <button class="modal-close" style="padding:8px 16px;border-radius:8px;border:none;background:transparent;font-size:14px;font-weight:500;color:#4b5563;cursor:pointer;">Cancelar</button>
                <button id="modal-ruta-submit" style="padding:8px 20px;border-radius:8px;border:none;background:#1773cf;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    Asignar a Ruta
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));

    overlay.querySelector('#modal-ruta-submit').addEventListener('click', async () => {
        const repartidorId = document.getElementById('modal-repartidor')?.value;
        if (!repartidorId) {
            mostrarToast('Selecciona un repartidor.', 'error');
            return;
        }

        try {
            await apiCall(`${API.repartidores}/${repartidorId}/reservas/${reservaId}`, { method: 'POST' });
            overlay.remove();
            mostrarToast(`Reserva de ${nombreCliente} añadida a la Ruta Diaria.`, 'success');
            await cargarReservas();
        } catch (err) {
            console.error('Error asignando ruta:', err);
            mostrarToast(err.message, 'error');
        }
    });
}

// ─── Eventos de botones en cada fila ─────────────────────────────────────────
function adjuntarEventosTabla() {

    // EDITAR
    document.querySelectorAll('button[aria-label="Editar"]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const reserva = reservasCache.find(r => r.id == this.dataset.id);
            if (!reserva) return;

            if (modalClientes.length === 0) {
                try { modalClientes = await apiCall(API.clientes); }
                catch (e) { mostrarToast('No se pudieron cargar los clientes.', 'error'); return; }
            }

            crearModal('editar', reserva);
        });
    });

    // CANCELAR
    document.querySelectorAll('button[aria-label="Cancelar"]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const reserva = reservasCache.find(r => r.id == this.dataset.id);
            const nombre  = reserva?.cliente?.nombre || `Reserva #${this.dataset.id}`;

            if (!confirm(`¿Estás seguro de que deseas cancelar la reserva de ${nombre}?`)) return;

            try {
                await apiCall(`${API.reservas}/${this.dataset.id}/estado?estado=Cancelada`, { method: 'PUT' });
                mostrarToast(`Reserva de ${nombre} cancelada.`, 'success');
                await cargarReservas();
            } catch (err) {
                mostrarToast(err.message, 'error');
            }
        });
    });

    // PASAR A RUTA DIARIA
    document.querySelectorAll('button[aria-label="Pasar a Ruta Diaria"]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const reserva = reservasCache.find(r => r.id == this.dataset.id);
            const nombre  = reserva?.cliente?.nombre || `Reserva #${this.dataset.id}`;

            try {
                const repartidores = await apiCall(API.repartidores);
                if (!repartidores?.length) {
                    mostrarToast('No hay repartidores disponibles.', 'error');
                    return;
                }
                crearModalRuta(this.dataset.id, nombre, repartidores);
            } catch (err) {
                mostrarToast(err.message, 'error');
            }
        });
    });
}

// ─── Filtros de tiempo ───────────────────────────────────────────────────────
function adjuntarFiltros() {
    const buttons = document.querySelectorAll('main button');

    buttons.forEach(btn => {
        const texto = btn.textContent.trim().toLowerCase();
        if (!texto.includes('semana') && !texto.includes('mes')) return;

        btn.addEventListener('click', async function () {
            buttons.forEach(b => {
                const t = b.textContent.trim().toLowerCase();
                if (t.includes('semana') || t.includes('mes')) {
                    b.style.backgroundColor = '#fff';
                    b.style.color = '#4b5563';
                    b.style.border = '1px solid #e5e7eb';
                }
            });
            this.style.backgroundColor = '#1773cf';
            this.style.color = '#fff';
            this.style.border = '1px solid #1773cf';

            try {
                const todas = await apiCall(API.reservas);
                const ahora = new Date();
                const desde = new Date(ahora);

                texto.includes('semana')
                    ? desde.setDate(ahora.getDate() - 7)
                    : desde.setMonth(ahora.getMonth() - 1);

                reservasCache = todas.filter(r => {
                    const fecha = new Date(r.fechaReserva);
                    return fecha >= desde && fecha <= ahora;
                });

                paginaActual = 1;
                renderTabla();
                renderPaginacion();
            } catch (err) {
                mostrarToast(err.message, 'error');
            }
        });
    });
}

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {

    // Verificar autenticación antes de hacer nada.
    // Si no está autenticado, AuthService redirige al login automáticamente.
    if (!AuthService.isAuthenticated()) {
        window.location.href = '/html/login.html';
        return;
    }

    // Botón crear nueva reserva
    const createBtn = document.getElementById('createReservationBtn');
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            if (modalClientes.length === 0) {
                try { modalClientes = await apiCall(API.clientes); }
                catch (e) { mostrarToast('No se pudieron cargar los clientes.', 'error'); return; }
            }
            crearModal('crear');
        });
    }

    adjuntarFiltros();
    await cargarReservas();

    console.log('Taxicamino - Sistema de gestión de reservas conectado a la API.');
});