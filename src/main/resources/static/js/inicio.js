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
    rutas:       '/api/rutas',
    detalles:    '/api/ruta-detalles',
    repartidores:'/api/repartidores'
};

// ─── Helper: usa AuthService para mandar el token automáticamente ───────────
async function apiCall(url, options = {}) {
    const res = await AuthService.authenticatedFetch(url, options);

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[${res.status}] ${errText || res.statusText}`);
    }

    return res.status === 204 || res.status === 200 && !res.headers.get('content-type')?.includes('json')
        ? null
        : res.json();
}

// ─── Estado local ────────────────────────────────────────────────────────────
let rutasCache = [];
let repartidoresCache = [];

// ─── Paginación ──────────────────────────────────────────────────────────────
const ITEMS_POR_PAGINA = 4;
let paginaActual = 1;

// ─── Colores inline para estados ─────────────────────────────────────────────
const ESTADO_STYLES = {
    'COMPLETADA': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    'EN_CURSO':   { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'PENDIENTE':  { bg: '#fed7aa', text: '#c2410c', border: '#fdba74' },
    'CANCELADA':  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

function getEstadoStyle(estado) {
    const s = ESTADO_STYLES[estado] || ESTADO_STYLES['PENDIENTE'];
    return `background-color:${s.bg};color:${s.text};border-color:${s.border};`;
}

// ─── Cargar rutas del día desde el backend ───────────────────────────────────
async function cargarRutasDeHoy() {
    try {
        rutasCache = await apiCall(`${API.rutas}/hoy`);
        paginaActual = 1;
        renderTabla();
        renderPaginacion();
        actualizarEstadisticas(rutasCache);
    } catch (err) {
        console.error('Error cargando rutas:', err);
        mostrarToast('No se pudieron cargar las rutas.', 'error');
    }
}

// ─── Renderizar tabla según página actual ───────────────────────────────────
function renderTabla() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const pagina = rutasCache.slice(inicio, inicio + ITEMS_POR_PAGINA);

    tbody.innerHTML = '';

    if (pagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding:40px 24px;text-align:center;font-size:14px;color:#9ca3af;">
                    No hay rutas programadas para hoy.
                </td>
            </tr>`;
        return;
    }

    pagina.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/50 transition-colors group';
        tr.dataset.rutaId = r.id;

        const estado = determinarEstado(r);
        const estadoStyle = getEstadoStyle(estado);
        const estadoTexto = estado === 'EN_CURSO' ? 'En curso' : estado === 'COMPLETADA' ? 'Finalizada' : estado === 'CANCELADA' ? 'Cancelada' : 'Pendiente';

        const precio = r.precio != null ? `€${r.precio.toFixed(2)}` : '€0.00';
        const precioCls = estado === 'CANCELADA' ? 'text-gray-400 line-through' : 'text-gray-900';

        const hora = extraerHora(r.fecha);
        const cliente = r.cliente || 'Cliente no especificado';
        const repartidor = r.repartidor?.nombre || 'Sin asignar';

        tr.innerHTML = `
            <td class="px-6 py-5 whitespace-nowrap text-sm font-semibold text-gray-900">${hora}</td>
            <td class="px-6 py-5">
                <div class="flex flex-col gap-0.5">
                    <div class="text-sm font-medium text-gray-900">${r.origen || 'Origen no especificado'}</div>
                    <div class="text-xs text-gray-400 flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">south</span> ${r.destino || 'Destino no especificado'}
                    </div>
                </div>
            </td>
            <td class="px-6 py-5">
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900">${cliente}</span>
                    <span class="text-xs text-gray-500 italic">${repartidor}</span>
                </div>
            </td>
            <td class="px-6 py-5 text-right whitespace-nowrap text-sm font-bold ${precioCls}">${precio}</td>
            <td class="px-6 py-5 whitespace-nowrap">
                <span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;border:1px solid;${estadoStyle}">
                    ${estadoTexto}
                </span>
            </td>
            <td class="px-6 py-5 whitespace-nowrap">
                <div class="flex items-center gap-4">
                    <button aria-label="Editar" data-id="${r.id}" class="text-primary hover:text-blue-800 text-sm font-semibold flex items-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-base">edit</span> Editar
                    </button>
                    <button aria-label="Duplicar" data-id="${r.id}" class="text-gray-400 hover:text-primary text-sm font-semibold flex items-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-base">content_copy</span> Duplicar
                    </button>
                </div>
            </td>`;

        tbody.appendChild(tr);
    });

    adjuntarEventosTabla();
}

// ─── Paginación dinámica ─────────────────────────────────────────────────────
function renderPaginacion() {
    const contenedor = document.querySelector('.flex.items-center.gap-1');
    if (!contenedor) return;

    const totalPaginas = Math.ceil(rutasCache.length / ITEMS_POR_PAGINA);

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

// ─── Actualizar estadísticas ─────────────────────────────────────────────────
function actualizarEstadisticas(rutas) {
    const total = rutas.length;
    const completadas = rutas.filter(r => determinarEstado(r) === 'COMPLETADA').length;
    const pendientes = rutas.filter(r => determinarEstado(r) === 'PENDIENTE').length;

    const statsCards = document.querySelectorAll('.grid.grid-cols-1 .text-3xl');
    if (statsCards.length >= 3) {
        statsCards[0].textContent = total;
        statsCards[1].textContent = completadas;
        statsCards[2].textContent = pendientes;
    }
}

// ─── Determinar estado de la ruta ───────────────────────────────────────────
function determinarEstado(ruta) {
    if (ruta.estado) return ruta.estado.toUpperCase();
    if (ruta.completada) return 'COMPLETADA';
    if (ruta.cancelada) return 'CANCELADA';
    if (ruta.enCurso) return 'EN_CURSO';
    return 'PENDIENTE';
}

// ─── Extraer hora de fecha ISO ──────────────────────────────────────────────
function extraerHora(isoDate) {
    if (!isoDate) return '--:--';
    const d = new Date(isoDate);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

// ─── Modal crear / editar ruta ───────────────────────────────────────────────
function crearModal(modo, rutaEditar = null) {
    document.querySelector('.modal-overlay')?.remove();

    const estadoOpciones = ['PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA']
        .map(e => {
            let selected = '';
            if (modo === 'editar' && determinarEstado(rutaEditar) === e) selected = 'selected';
            if (modo === 'crear' && e === 'PENDIENTE') selected = 'selected';
            const texto = e === 'EN_CURSO' ? 'En curso' : e === 'COMPLETADA' ? 'Finalizada' : e === 'CANCELADA' ? 'Cancelada' : 'Pendiente';
            return `<option value="${e}" ${selected}>${texto}</option>`;
        })
        .join('');

    const repartidorOpciones = repartidoresCache
        .map(r => {
            const selected = rutaEditar?.repartidor?.id === r.id ? 'selected' : '';
            return `<option value="${r.id}" ${selected}>${r.nombre}</option>`;
        })
        .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:520px;margin:0 16px;overflow:hidden;animation:modalIn 0.25s ease forwards;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">${modo === 'crear' ? 'Nueva Ruta' : 'Editar Ruta'}</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>

            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px;max-height:65vh;overflow-y:auto;">
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Fecha y Hora</label>
                    <input type="datetime-local" id="modal-fecha"
                        value="${rutaEditar ? formatDatetimeLocal(rutaEditar.fecha) : ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Origen</label>
                    <input type="text" id="modal-origen" placeholder="Ej. Aeropuerto T4"
                        value="${rutaEditar?.origen || ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Destino</label>
                    <input type="text" id="modal-destino" placeholder="Ej. Hotel Ritz"
                        value="${rutaEditar?.destino || ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Cliente</label>
                    <input type="text" id="modal-cliente" placeholder="Nombre del cliente"
                        value="${rutaEditar?.cliente || ''}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Repartidor</label>
                    <select id="modal-repartidor" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="">Sin asignar</option>
                        ${repartidorOpciones}
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Precio (€)</label>
                    <input type="number" id="modal-precio" step="0.01" min="0" placeholder="0.00"
                        value="${rutaEditar?.precio ?? ''}"
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
                    ${modo === 'crear' ? 'Crear Ruta' : 'Guardar Cambios'}
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));
    overlay.querySelector('#modal-submit').addEventListener('click', () => handleModalSubmit(modo, rutaEditar));
}

function formatDatetimeLocal(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate).toISOString().slice(0, 16);
}

// ─── Submit modal crear/editar ───────────────────────────────────────────────
async function handleModalSubmit(modo, rutaEditar) {
    const fecha = document.getElementById('modal-fecha')?.value;
    const origen = document.getElementById('modal-origen')?.value.trim();
    const destino = document.getElementById('modal-destino')?.value.trim();
    const cliente = document.getElementById('modal-cliente')?.value.trim();
    const repartidorId = document.getElementById('modal-repartidor')?.value;
    const precio = document.getElementById('modal-precio')?.value;

    if (!origen || !destino) {
        mostrarToast('Origen y destino son obligatorios.', 'error');
        return;
    }

    try {
        if (modo === 'crear') {
            const nuevaRuta = {
                fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
                origen,
                destino,
                cliente: cliente || null,
                repartidor: repartidorId ? { id: parseInt(repartidorId) } : null,
                precio: precio ? parseFloat(precio) : 0,
                estado: 'PENDIENTE'
            };

            await apiCall(API.rutas, {
                method: 'POST',
                body: JSON.stringify(nuevaRuta)
            });

            document.querySelector('.modal-overlay')?.remove();
            mostrarToast('Ruta creada correctamente.', 'success');
            await cargarRutasDeHoy();

        } else {
            const rutaActualizada = {
                ...rutaEditar,
                fecha: fecha ? new Date(fecha).toISOString() : rutaEditar.fecha,
                origen,
                destino,
                cliente,
                repartidor: repartidorId ? { id: parseInt(repartidorId) } : null,
                precio: precio ? parseFloat(precio) : 0,
                estado: document.getElementById('modal-estado')?.value || rutaEditar.estado
            };

            await apiCall(`${API.rutas}/${rutaEditar.id}`, {
                method: 'PUT',
                body: JSON.stringify(rutaActualizada)
            });

            document.querySelector('.modal-overlay')?.remove();
            mostrarToast('Ruta actualizada correctamente.', 'success');
            await cargarRutasDeHoy();
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
            const ruta = rutasCache.find(r => r.id == this.dataset.id);
            if (!ruta) return;

            if (repartidoresCache.length === 0) {
                try { repartidoresCache = await apiCall(API.repartidores); }
                catch (e) { mostrarToast('No se pudieron cargar los repartidores.', 'error'); return; }
            }

            crearModal('editar', ruta);
        });
    });

    // DUPLICAR
    document.querySelectorAll('button[aria-label="Duplicar"]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const ruta = rutasCache.find(r => r.id == this.dataset.id);
            if (!ruta) return;

            if (!confirm(`¿Duplicar la ruta ${ruta.origen} → ${ruta.destino}?`)) return;

            try {
                const nuevaRuta = {
                    ...ruta,
                    id: null,
                    fecha: new Date().toISOString()
                };

                await apiCall(API.rutas, {
                    method: 'POST',
                    body: JSON.stringify(nuevaRuta)
                });

                mostrarToast('Ruta duplicada correctamente.', 'success');
                await cargarRutasDeHoy();
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

    // Actualizar fecha display
    const inputFecha = document.querySelector('input[type="text"][readonly]');
    if (inputFecha) {
        const fecha = new Date();
        inputFecha.value = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Botón crear nueva ruta
    const createBtn = document.querySelector('button.bg-primary');
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            if (repartidoresCache.length === 0) {
                try { repartidoresCache = await apiCall(API.repartidores); }
                catch (e) { mostrarToast('No se pudieron cargar los repartidores.', 'error'); return; }
            }
            crearModal('crear');
        });
    }

    await cargarRutasDeHoy();

    console.log('Taxicamino - Sistema de gestión de ruta diaria conectado a la API.');
});