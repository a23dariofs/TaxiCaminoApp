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
    clientes: '/api/clientes',
    reservas: '/api/reservas',
    agencias: '/api/agencias',
    albergues: '/api/albergues',
    empresas: '/api/empresas',
    repartidores: '/api/repartidores'
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
let reservasCache = [];
let modalClientes = [];
let modalAgencias = [];
let modalAlbergues = [];
let modalEmpresas = [];
let modalRepartidores = [];

// ─── Paginación ──────────────────────────────────────────────────────────────
const ITEMS_POR_PAGINA = 4;
let paginaActual = 1;

// ─── Colores inline para estados ─────────────────────────────────────────────
const ESTADO_STYLES = {
    'Pendiente':  { bg: '#fffbeb', text: '#b45309', border: '#fcd34d' },
    'Pagado en ruta': { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    'Bizum': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'Pagado por transferencia': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    'Cancelada':  { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

function getEstadoStyle(estado) {
    const s = ESTADO_STYLES[estado] || ESTADO_STYLES['Pendiente'];
    return `background-color:${s.bg};color:${s.text};border-color:${s.border};`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE LOGOUT
// ═══════════════════════════════════════════════════════════════════════════
function configurarLogout() {
    const userButton = document.querySelector('header button[class*="rounded-full"]');
    if (userButton) {
        userButton.addEventListener('click', () => {
            mostrarMenuUsuario();
        });
    }
}

function mostrarMenuUsuario() {
    const menuExistente = document.getElementById('userMenu');
    if (menuExistente) {
        menuExistente.remove();
        return;
    }

    const userInfo = AuthService.getUserInfo();

    const menu = document.createElement('div');
    menu.id = 'userMenu';
    menu.className = 'absolute top-16 right-10 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 min-w-[200px]';
    menu.innerHTML = `
        <div class="px-4 py-2 border-b border-gray-100">
            <p class="text-sm font-semibold text-gray-900">${userInfo?.username || 'Usuario'}</p>
            <p class="text-xs text-gray-500">${userInfo?.role || 'USER'}</p>
        </div>
        <button onclick="AuthService.logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">logout</span>
            <span>Cerrar sesión</span>
        </button>
    `;

    document.body.appendChild(menu);

    setTimeout(() => {
        document.addEventListener('click', function cerrarMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', cerrarMenu);
            }
        });
    }, 100);
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

        // Mostrar precio total de las etapas si existen
        const precioMostrar = r.precioTotal ?? r.precio ?? 0;
        const precio = r.estado === 'Cancelada'
            ? `<span style="text-decoration:line-through;color:#9ca3af;">${formatPrecio(precioMostrar)}</span>`
            : `<span style="color:#111827;">${formatPrecio(precioMostrar)}</span>`;

        // Mostrar resumen de etapas si existen
        const rutaInfo = r.etapas && r.etapas.length > 0
            ? `${r.etapas[0].alojamientoSalida?.nombre || '—'} → ${r.etapas[r.etapas.length - 1].alojamientoDestino?.nombre || '—'} (${r.etapas.length} etapas)`
            : `${r.origen || '—'} - ${r.destino || '—'}`;

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
            </button>`;
        }

        // Botón generar etiquetas (siempre visible si hay etapas)
        if (r.etapas && r.etapas.length > 0) {
            botones += `
            <button aria-label="Generar Etiquetas" data-id="${r.id}" title="Generar etiquetas PDF"
                class="etiquetas-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                <span class="material-symbols-outlined text-base">local_offer</span>
            </button>`;
        }

        tr.innerHTML = `
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${formatFechaHora(r.fechaCreacion || r.fechaReserva)}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">${r.cliente?.nombre || '—'}</td>
            <td class="px-6 py-5 text-sm text-gray-600">${rutaInfo}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${r.pasajeros ?? (r.etapas?.[0]?.cantidadMochilas || '—')}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${r.observaciones || '-'}</td>
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

function formatFecha(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

// ═══════════════════════════════════════════════════════════════════════════
// MODAL CREAR RESERVA CON ETAPAS
// ═══════════════════════════════════════════════════════════════════════════

let etapasCounter = 0;

function crearModalReservaCompleta() {
    document.querySelector('.modal-overlay')?.remove();

    etapasCounter = 0;

    const agenciaOpciones = modalAgencias
        .map(a => `<option value="${a.nombre}">`)
        .join('');

    const empresaOpciones = modalEmpresas
        .map(e => `<option value="${e.nombre}">`)
        .join('');

    const repartidorOpciones = modalRepartidores
        .map(r => `<option value="${r.id}">${r.nombre}</option>`)
        .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;overflow-y:auto;padding:20px;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:900px;margin:auto;overflow:hidden;animation:modalIn 0.25s ease forwards;">

            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">Nueva Reserva del Camino</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>

            <!-- Body -->
            <div style="padding:20px 24px;max-height:70vh;overflow-y:auto;">

                <!-- Datos Cliente (Buscar o Crear) -->
                <div style="margin-bottom:24px;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                    <h4 style="font-size:13px;font-weight:700;color:#111827;margin-bottom:12px;">Datos del Cliente</h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                        <div>
                            <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Email *</label>
                            <input type="email" id="modal-cliente-email" placeholder="email@ejemplo.com" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;">
                        </div>
                        <div>
                            <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Teléfono *</label>
                            <input type="tel" id="modal-cliente-telefono" placeholder="600123456" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;">
                        </div>
                        <div>
                            <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Nombre *</label>
                            <input type="text" id="modal-cliente-nombre" placeholder="Juan" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;">
                        </div>
                        <div>
                            <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Apellidos</label>
                            <input type="text" id="modal-cliente-apellidos" placeholder="Pérez García" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;">
                        </div>
                    </div>
                </div>

                <!-- Datos Reserva -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
                    <div>
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Agencia</label>
                        <input list="agencias-list" id="modal-agencia" placeholder="Escribe o selecciona agencia" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;">
                        <datalist id="agencias-list">
                            ${agenciaOpciones}
                        </datalist>
                    </div>
                    <div>
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Empresa</label>
                        <input list="empresas-list" id="modal-empresa" placeholder="Escribe o selecciona empresa" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;">
                        <datalist id="empresas-list">
                            ${empresaOpciones}
                        </datalist>
                    </div>
                    <div>
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Repartidor</label>
                        <select id="modal-repartidor" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                            <option value="">Sin asignar</option>
                            ${repartidorOpciones}
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Estado</label>
                        <select id="modal-estado" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                            <option value="Pendiente" selected>Pendiente</option>
                            <option value="Pagado en ruta">Pagado en ruta</option>
                            <option value="Bizum">Bizum</option>
                            <option value="Pagado por transferencia">Pagado por transferencia</option>
                        </select>
                    </div>
                </div>

                <div style="margin-bottom:24px;">
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Observaciones</label>
                    <textarea id="modal-observaciones" rows="2" placeholder="Observaciones/notas de la reserva" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;resize:vertical;"></textarea>
                </div>

                <!-- Etapas del Camino -->
                <div style="margin-bottom:16px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                        <h4 style="font-size:14px;font-weight:700;color:#111827;">Etapas del Camino</h4>
                        <button id="btn-add-etapa" type="button" style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#1773cf;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">
                            <span class="material-symbols-outlined" style="font-size:18px;">add</span>
                            <span>Añadir Etapa</span>
                        </button>
                    </div>
                    <div id="etapas-container" style="display:flex;flex-direction:column;gap:12px;">
                        <!-- Las etapas se añaden dinámicamente aquí -->
                    </div>
                </div>

                <!-- Precio Total -->
                <div style="margin-top:24px;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:14px;font-weight:600;color:#6b7280;">PRECIO TOTAL:</span>
                    <span id="precio-total-display" style="font-size:20px;font-weight:700;color:#1773cf;">€0.00</span>
                </div>
            </div>

            <!-- Footer -->
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #f3f4f6;background:#f9fafb;">
                <button class="modal-close" style="padding:8px 16px;border-radius:8px;border:none;background:transparent;font-size:14px;font-weight:500;color:#4b5563;cursor:pointer;">Cancelar</button>
                <button id="modal-submit-completa" style="padding:8px 20px;border-radius:8px;border:none;background:#1773cf;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    Crear Reserva
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    // Eventos
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));

    // Añadir primera etapa automáticamente
    document.getElementById('btn-add-etapa').addEventListener('click', añadirEtapa);
    añadirEtapa();

    // Submit
    document.getElementById('modal-submit-completa').addEventListener('click', handleSubmitReservaCompleta);
}

function añadirEtapa() {
    const container = document.getElementById('etapas-container');
    const index = etapasCounter++;

    const albergueOpciones = modalAlbergues
        .map(a => `<option value="${a.nombre} - ${a.ciudad}">`)
        .join('');

    const etapaHTML = `
        <div class="etapa-item" data-index="${index}" style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fff;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:13px;font-weight:700;color:#374151;">Etapa ${index + 1}</span>
                <button type="button" class="btn-remove-etapa" data-index="${index}" style="display:flex;align-items:center;justify-content:center;height:28px;width:28px;border:none;background:#fee2e2;color:#b91c1c;border-radius:6px;cursor:pointer;transition:all 0.2s;">
                    <span class="material-symbols-outlined" style="font-size:18px;">close</span>
                </button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin-bottom:8px;">
                <div>
                    <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Fecha</label>
                    <input type="date" class="etapa-fecha" data-index="${index}" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
                </div>
                <div>
                    <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Cantidad Mochilas</label>
                    <input type="number" class="etapa-cantidad" data-index="${index}" min="1" value="1" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
                </div>
                <div>
                    <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Precio €</label>
                    <input type="number" class="etapa-precio" data-index="${index}" value="6.00" step="0.01" min="0" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                <div>
                    <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Alojamiento Salida *</label>
                    <input list="albergues-list-${index}-salida" class="etapa-salida" data-index="${index}" placeholder="Escribe o selecciona" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
                    <datalist id="albergues-list-${index}-salida">
                        ${albergueOpciones}
                    </datalist>
                </div>
                <div>
                    <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Alojamiento Destino *</label>
                    <input list="albergues-list-${index}-destino" class="etapa-destino" data-index="${index}" placeholder="Escribe o selecciona" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
                    <datalist id="albergues-list-${index}-destino">
                        ${albergueOpciones}
                    </datalist>
                </div>
            </div>
            <div>
                <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Comentarios</label>
                <input type="text" class="etapa-comentarios" data-index="${index}" placeholder="Comentarios opcionales" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', etapaHTML);

    // Eventos de la etapa recién añadida
    const etapaElem = container.querySelector(`.etapa-item[data-index="${index}"]`);

    // Autocompletar origen siguiente = destino anterior
    const inputDestino = etapaElem.querySelector('.etapa-destino');
    inputDestino.addEventListener('change', () => autocompletarSiguienteOrigen(index));

    // Calcular precio al cambiar cantidad o precio
    const inputCantidad = etapaElem.querySelector('.etapa-cantidad');
    const inputPrecio = etapaElem.querySelector('.etapa-precio');

    inputCantidad.addEventListener('input', () => calcularPrecioTotal());
    inputPrecio.addEventListener('input', () => calcularPrecioTotal());

    // Eliminar etapa
    const btnEliminar = etapaElem.querySelector('.btn-remove-etapa');
    btnEliminar.addEventListener('click', () => eliminarEtapa(index));

    // Calcular precio inicial
    calcularPrecioTotal();
    renumerarEtapas();
}

function eliminarEtapa(index) {
    const etapa = document.querySelector(`.etapa-item[data-index="${index}"]`);
    if (etapa) {
        etapa.remove();
        renumerarEtapas();
        calcularPrecioTotal();
    }
}

function renumerarEtapas() {
    const etapas = document.querySelectorAll('.etapa-item');
    etapas.forEach((etapa, i) => {
        etapa.querySelector('span').textContent = `Etapa ${i + 1}`;
    });
}

function autocompletarSiguienteOrigen(index) {
    const etapaActual = document.querySelector(`.etapa-item[data-index="${index}"]`);
    const destinoValue = etapaActual.querySelector('.etapa-destino').value;

    if (!destinoValue) return;

    // Buscar la siguiente etapa
    const todasEtapas = Array.from(document.querySelectorAll('.etapa-item'));
    const indexActual = todasEtapas.indexOf(etapaActual);
    const siguienteEtapa = todasEtapas[indexActual + 1];

    if (siguienteEtapa) {
        const inputOrigen = siguienteEtapa.querySelector('.etapa-salida');
        inputOrigen.value = destinoValue;
    }
}

function calcularPrecioTotal() {
    let total = 0;
    document.querySelectorAll('.etapa-item').forEach(etapa => {
        const cantidad = parseInt(etapa.querySelector('.etapa-cantidad').value) || 0;
        const precio = parseFloat(etapa.querySelector('.etapa-precio').value) || 0;
        total += cantidad * precio;
    });

    document.getElementById('precio-total-display').textContent = `€${total.toFixed(2)}`;
}

async function handleSubmitReservaCompleta() {
    // Datos del cliente
    const clienteEmail = document.getElementById('modal-cliente-email').value.trim();
    const clienteTelefono = document.getElementById('modal-cliente-telefono').value.trim();
    const clienteNombre = document.getElementById('modal-cliente-nombre').value.trim();
    const clienteApellidos = document.getElementById('modal-cliente-apellidos').value.trim();

    const agenciaNombre = document.getElementById('modal-agencia').value.trim();
    const empresaNombre = document.getElementById('modal-empresa').value.trim();
    const repartidorId = document.getElementById('modal-repartidor').value;
    const observaciones = document.getElementById('modal-observaciones').value.trim();
    const estado = document.getElementById('modal-estado').value;

    // Validar cliente
    if (!clienteEmail && !clienteTelefono) {
        mostrarToast('Debes proporcionar al menos email o teléfono del cliente.', 'error');
        return;
    }

    if (!clienteNombre) {
        mostrarToast('El nombre del cliente es obligatorio.', 'error');
        return;
    }

    // Recoger etapas
    const etapas = [];
    const etapasItems = document.querySelectorAll('.etapa-item');

    if (etapasItems.length === 0) {
        mostrarToast('Añade al menos una etapa del Camino.', 'error');
        return;
    }

    etapasItems.forEach((etapa, i) => {
        const fecha = etapa.querySelector('.etapa-fecha').value;
        const salidaNombre = etapa.querySelector('.etapa-salida').value.trim();
        const destinoNombre = etapa.querySelector('.etapa-destino').value.trim();
        const cantidad = parseInt(etapa.querySelector('.etapa-cantidad').value) || 0;
        const precio = parseFloat(etapa.querySelector('.etapa-precio').value) || 6.0;
        const comentarios = etapa.querySelector('.etapa-comentarios').value.trim();

        if (!salidaNombre || !destinoNombre) {
            mostrarToast(`La etapa ${i + 1} necesita alojamiento de salida y destino.`, 'error');
            throw new Error('Etapa incompleta');
        }

        etapas.push({
            fecha: fecha || null,
            alojamientoSalidaNombre: salidaNombre,
            alojamientoDestinoNombre: destinoNombre,
            cantidadMochilas: cantidad,
            precioUnitario: precio,
            comentarios: comentarios || null,
            orden: i + 1
        });
    });

    // Crear DTO
    const reservaDTO = {
        clienteEmail: clienteEmail || null,
        clienteTelefono: clienteTelefono || null,
        clienteNombre: clienteNombre,
        clienteApellidos: clienteApellidos || null,
        agenciaNombre: agenciaNombre || null,
        empresaNombre: empresaNombre || null,
        repartidorId: repartidorId ? parseInt(repartidorId) : null,
        observaciones: observaciones || null,
        estado: estado,
        etapas: etapas
    };

    try {
        await apiCall(`${API.reservas}/completa`, {
            method: 'POST',
            body: JSON.stringify(reservaDTO)
        });

        document.querySelector('.modal-overlay')?.remove();
        mostrarToast('Reserva creada correctamente con ' + etapas.length + ' etapas.', 'success');
        await cargarReservas();

        // Recargar datos por si se crearon nuevos
        modalAgencias = await apiCall(API.agencias);
        modalAlbergues = await apiCall(API.albergues);
        modalEmpresas = await apiCall(API.empresas);
    } catch (err) {
        console.error('Error creando reserva completa:', err);
        mostrarToast(err.message, 'error');
    }
}

// ─── Eventos de botones en cada fila ─────────────────────────────────────────
function adjuntarEventosTabla() {

    // EDITAR
    document.querySelectorAll('button[aria-label="Editar"]').forEach(btn => {
        btn.addEventListener('click', async function () {
            const reserva = reservasCache.find(r => r.id == this.dataset.id);
            if (!reserva) return;

            // Abrir modal de edición con los datos de la reserva
            abrirModalEdicion(reserva);
        });
    });

    // GENERAR ETIQUETAS PDF
    document.querySelectorAll('.etiquetas-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const reservaId = this.dataset.id;
            await generarEtiquetasPDF(reservaId);
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
                    const fecha = new Date(r.fechaCreacion || r.fechaReserva);
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

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: ABRIR MODAL DE EDICIÓN
// ═══════════════════════════════════════════════════════════════════════════
function abrirModalEdicion(reserva) {
    // Remover modal existente si lo hay
    document.querySelector('.modal-overlay')?.remove();

    etapasCounter = 0;

    const agenciaOpciones = modalAgencias
        .map(a => `<option value="${a.nombre}">`)
        .join('');

    const empresaOpciones = modalEmpresas
        .map(e => `<option value="${e.nombre}">`)
        .join('');

    const repartidorOpciones = modalRepartidores
        .map(r => `<option value="${r.id}">${r.nombre}</option>`)
        .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;overflow-y:auto;padding:20px;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:900px;margin:auto;overflow:hidden;animation:modalIn 0.25s ease forwards;">

            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">Editar Reserva #${reserva.id}</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>

            <!-- Body -->
            <div style="padding:20px 24px;max-height:70vh;overflow-y:auto;">

                <!-- Datos Cliente (solo lectura) -->
                <div style="margin-bottom:24px;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                    <h4 style="font-size:13px;font-weight:700;color:#111827;margin-bottom:12px;">Datos del Cliente (Solo lectura)</h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                        <div>
                            <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:6px;">Nombre</label>
                            <input type="text" value="${reserva.cliente?.nombre || ''}" disabled style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#6b7280;background:#f9fafb;">
                        </div>
                        <div>
                            <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:6px;">Email</label>
                            <input type="text" value="${reserva.cliente?.email || ''}" disabled style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#6b7280;background:#f9fafb;">
                        </div>
                    </div>
                </div>

                <!-- Datos Reserva -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
                    <div>
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Agencia</label>
                        <input list="agencias-list-edit" id="modal-agencia-edit" value="${reserva.agencia?.nombre || ''}" placeholder="Escribe o selecciona agencia" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;">
                        <datalist id="agencias-list-edit">
                            ${agenciaOpciones}
                        </datalist>
                    </div>
                    <div>
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Empresa</label>
                        <input list="empresas-list-edit" id="modal-empresa-edit" value="${reserva.empresa?.nombre || ''}" placeholder="Escribe o selecciona empresa" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;">
                        <datalist id="empresas-list-edit">
                            ${empresaOpciones}
                        </datalist>
                    </div>
                    <div>
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Repartidor</label>
                        <select id="modal-repartidor-edit" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                            <option value="">Sin asignar</option>
                            ${repartidorOpciones}
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Estado</label>
                        <select id="modal-estado-edit" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                            <option value="Pendiente" ${reserva.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Pagado en ruta" ${reserva.estado === 'Pagado en ruta' ? 'selected' : ''}>Pagado en ruta</option>
                            <option value="Bizum" ${reserva.estado === 'Bizum' ? 'selected' : ''}>Bizum</option>
                            <option value="Pagado por transferencia" ${reserva.estado === 'Pagado por transferencia' ? 'selected' : ''}>Pagado por transferencia</option>
                        </select>
                    </div>
                </div>

                <div style="margin-bottom:24px;">
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Observaciones</label>
                    <textarea id="modal-observaciones-edit" rows="2" placeholder="Observaciones/notas de la reserva" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;resize:vertical;">${reserva.observaciones || ''}</textarea>
                </div>

                <!-- Etapas del Camino (Solo lectura para esta versión) -->
                <div style="margin-bottom:16px;">
                    <h4 style="font-size:14px;font-weight:700;color:#111827;margin-bottom:12px;">Etapas del Camino (${reserva.etapas?.length || 0} etapas)</h4>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        ${(reserva.etapas || []).map((etapa, i) => `
                            <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#f9fafb;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                    <span style="font-size:13px;font-weight:700;color:#374151;">Etapa ${i + 1}</span>
                                    <span style="font-size:12px;color:#6b7280;">${etapa.fecha || 'Sin fecha'}</span>
                                </div>
                                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px;color:#6b7280;">
                                    <div><strong>Origen:</strong> ${etapa.alojamientoSalida?.nombre || '—'}</div>
                                    <div><strong>Destino:</strong> ${etapa.alojamientoDestino?.nombre || '—'}</div>
                                    <div><strong>Precio:</strong> €${(etapa.cantidadMochilas * etapa.precioUnitario).toFixed(2)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Precio Total -->
                <div style="margin-top:24px;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:14px;font-weight:600;color:#6b7280;">PRECIO TOTAL:</span>
                    <span style="font-size:20px;font-weight:700;color:#1773cf;">€${(reserva.precioTotal || 0).toFixed(2)}</span>
                </div>
            </div>

            <!-- Footer -->
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #f3f4f6;background:#f9fafb;">
                <button class="modal-close" style="padding:8px 16px;border-radius:8px;border:none;background:transparent;font-size:14px;font-weight:500;color:#4b5563;cursor:pointer;">Cancelar</button>
                <button id="modal-guardar-edicion" style="padding:8px 20px;border-radius:8px;border:none;background:#1773cf;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    Guardar Cambios
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    // Eventos
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));

    // Preseleccionar repartidor
    if (reserva.repartidor?.id) {
        document.getElementById('modal-repartidor-edit').value = reserva.repartidor.id;
    }

    // Guardar cambios
    document.getElementById('modal-guardar-edicion').addEventListener('click', async () => {
        await guardarEdicionReserva(reserva.id);
    });
}

async function guardarEdicionReserva(reservaId) {
    const agenciaNombre = document.getElementById('modal-agencia-edit').value.trim();
    const empresaNombre = document.getElementById('modal-empresa-edit').value.trim();
    const repartidorId = document.getElementById('modal-repartidor-edit').value;
    const estado = document.getElementById('modal-estado-edit').value;
    const observaciones = document.getElementById('modal-observaciones-edit').value.trim();

    const updateData = {
        agenciaNombre: agenciaNombre || null,
        empresaNombre: empresaNombre || null,
        repartidorId: repartidorId ? parseInt(repartidorId) : null,
        estado: estado,
        observaciones: observaciones || null
    };

    try {
        await apiCall(`${API.reservas}/${reservaId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        document.querySelector('.modal-overlay')?.remove();
        mostrarToast('Reserva actualizada correctamente', 'success');
        await cargarReservas();
    } catch (err) {
        console.error('Error actualizando reserva:', err);
        mostrarToast(err.message, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN: GENERAR ETIQUETAS PDF Y ENVIAR POR EMAIL
// ═══════════════════════════════════════════════════════════════════════════
async function generarEtiquetasPDF(reservaId) {
    const reserva = reservasCache.find(r => r.id == reservaId);
    if (!reserva) {
        mostrarToast('Reserva no encontrada', 'error');
        return;
    }

    if (!reserva.etapas || reserva.etapas.length === 0) {
        mostrarToast('Esta reserva no tiene etapas', 'error');
        return;
    }

    if (!reserva.cliente || !reserva.cliente.email) {
        mostrarToast('El cliente no tiene email registrado', 'error');
        return;
    }

    if (!confirm(`¿Generar y enviar ${reserva.etapas.length} etiquetas PDF a ${reserva.cliente.email}?`)) {
        return;
    }

    try {
        mostrarToast('Generando etiquetas PDF...', 'info');

        // Llamar al endpoint del backend
        await apiCall(`${API.reservas}/${reservaId}/generar-etiquetas`, {
            method: 'POST'
        });

        mostrarToast(`Etiquetas PDF enviadas a ${reserva.cliente.email}`, 'success');
    } catch (err) {
        console.error('Error generando etiquetas:', err);
        mostrarToast('Error al generar etiquetas: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', async function () {

    if (!AuthService.isAuthenticated()) {
        window.location.href = '/html/login.html';
        return;
    }

    configurarLogout();

    // Cargar datos necesarios para el modal
    try {
        modalClientes = await apiCall(API.clientes);
        modalAgencias = await apiCall(API.agencias);
        modalAlbergues = await apiCall(API.albergues);
        modalEmpresas = await apiCall(API.empresas);
        modalRepartidores = await apiCall(API.repartidores);
    } catch (e) {
        console.error('Error cargando datos:', e);
        mostrarToast('Error cargando datos iniciales.', 'error');
    }

    // Botón crear nueva reserva
    const createBtn = document.getElementById('createReservationBtn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            crearModalReservaCompleta();
        });
    }

    adjuntarFiltros();
    await cargarReservas();

    console.log('✅ Taxicamino - Sistema de gestión de reservas con etapas conectado.');
});