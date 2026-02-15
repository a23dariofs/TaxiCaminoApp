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
    clientes:     '/api/clientes',
    albergues:    '/api/albergues'
};

// ─── Helper: usa AuthService para mandar el token automáticamente ───────────
async function apiCall(url, options = {}) {
    if (options.body && !options.headers) {
        options.headers = { 'Content-Type': 'application/json' };
    } else if (options.body && options.headers && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }

    const res = await AuthService.authenticatedFetch(url, options);

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[${res.status}] ${errText || res.statusText}`);
    }

    return res.status === 204 ? null : res.json();
}

// ─── Estado local ────────────────────────────────────────────────────────────
let presupuestosCache = [];
let clientesCache = [];
let alberguesCache = [];

// ─── Paginación ──────────────────────────────────────────────────────────────
const ITEMS_POR_PAGINA = 5;
let paginaActual = 1;

// ─── Colores inline para estados ─────────────────────────────────────────────
const ESTADO_STYLES = {
    'ACEPTADO':  { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    'PENDIENTE': { bg: '#fed7aa', text: '#c2410c', border: '#fdba74' },
    'RECHAZADO': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
    'EXPIRADO':  { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
};

function getEstadoStyle(estado) {
    const s = ESTADO_STYLES[estado] || ESTADO_STYLES['PENDIENTE'];
    return `background-color:${s.bg};color:${s.text};border-color:${s.border};`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE LOGOUT
// ═══════════════════════════════════════════════════════════════════════════
function configurarLogout() {
    // Buscar el botón de usuario en el header
    const userButton = document.querySelector('header button[class*="rounded-full"]');
    if (userButton) {
        // Convertir el botón en un dropdown con opción de logout
        userButton.addEventListener('click', () => {
            mostrarMenuUsuario();
        });
    }
}

function mostrarMenuUsuario() {
    // Eliminar menú existente si hay uno
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

    // Cerrar al hacer clic fuera
    setTimeout(() => {
        document.addEventListener('click', function cerrarMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', cerrarMenu);
            }
        });
    }, 100);
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
    const tbody = document.getElementById('budgetsTableBody');
    if (!tbody) return;

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const pagina = presupuestosCache.slice(inicio, inicio + ITEMS_POR_PAGINA);

    tbody.innerHTML = '';

    if (presupuestosCache.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding:40px 24px;text-align:center;font-size:14px;color:#9ca3af;">
                    No hay presupuestos registrados.
                </td>
            </tr>`;
        return;
    }

    pagina.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/50 transition-colors';
        tr.dataset.presupuestoId = p.id;

        const estado = p.estado || 'PENDIENTE';
        const estadoStyle = getEstadoStyle(estado);
        const estadoTexto = estado === 'ACEPTADO' ? 'Aceptado' : estado === 'RECHAZADO' ? 'Rechazado' : estado === 'EXPIRADO' ? 'Expirado' : 'Pendiente';

        const fechaEmision = p.fechaEmision ? formatFecha(p.fechaEmision) : '-';
        const fechaValidez = p.fechaValidez ? formatFecha(p.fechaValidez) : '-';
        const importe = p.importeTotal != null ? `€${p.importeTotal.toFixed(2)}` : '€0.00';

        let botonesAccion = '';

        if (estado === 'PENDIENTE') {
            botonesAccion = `
                <div class="flex items-center gap-2">
                    <button aria-label="Enviar email" data-id="${p.id}"
                        class="send-btn flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-200">
                        <span class="material-symbols-outlined text-sm">send</span> Enviar
                    </button>
                    <button aria-label="Editar" data-id="${p.id}"
                        class="edit-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                        <span class="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button aria-label="Eliminar" data-id="${p.id}"
                        class="delete-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>`;
        } else if (estado === 'ACEPTADO') {
            botonesAccion = `
                <div class="flex items-center gap-2">
                    <span class="text-xs text-green-600 font-semibold italic flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">check_circle</span> Aceptado
                    </span>
                    <button aria-label="Eliminar" data-id="${p.id}"
                        class="delete-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>`;
        } else {
            botonesAccion = `
                <div class="flex items-center gap-2">
                    <button aria-label="Eliminar" data-id="${p.id}"
                        class="delete-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>`;
        }

        tr.innerHTML = `
            <td class="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">#${p.id || '—'}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${p.cliente?.nombre || '—'}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${fechaEmision}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${fechaValidez}</td>
            <td class="px-6 py-5 text-right whitespace-nowrap text-sm font-bold text-gray-900">${importe}</td>
            <td class="px-6 py-5 whitespace-nowrap">
                <span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;border:1px solid;${estadoStyle}">
                    ${estadoTexto}
                </span>
            </td>
            <td class="px-6 py-5 whitespace-nowrap">${botonesAccion}</td>`;

        tbody.appendChild(tr);
    });

    adjuntarEventosTabla();
}

// ─── Formateo fecha → "22/08/2024" ──────────────────────────────────────────
function formatFecha(isoDate) {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
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
    }, 4000);
}

// ─── Renderizar paginación ──────────────────────────────────────────────────
function renderPaginacion() {
    const totalPaginas = Math.ceil(presupuestosCache.length / ITEMS_POR_PAGINA);
    const container = document.querySelector('.pagination-container');

    if (!container || totalPaginas <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    const paginas = getPaginasVisibles(paginaActual, totalPaginas);

    let html = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:24px;">';

    html += `<button onclick="cambiarPagina(${paginaActual - 1})"
        ${paginaActual === 1 ? 'disabled' : ''}
        style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;cursor:${paginaActual === 1 ? 'not-allowed' : 'pointer'};opacity:${paginaActual === 1 ? '0.5' : '1'};">
        <span class="material-symbols-outlined" style="font-size:18px;">chevron_left</span>
    </button>`;

    paginas.forEach(p => {
        if (p === '...') {
            html += '<span style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;color:#9ca3af;">...</span>';
        } else {
            const isActive = p === paginaActual;
            html += `<button onclick="cambiarPagina(${p})"
                style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;border-radius:8px;border:1px solid ${isActive ? '#1773cf' : '#e5e7eb'};background:${isActive ? '#1773cf' : '#fff'};color:${isActive ? '#fff' : '#6b7280'};font-size:14px;font-weight:${isActive ? '700' : '500'};cursor:pointer;">
                ${p}
            </button>`;
        }
    });

    html += `<button onclick="cambiarPagina(${paginaActual + 1})"
        ${paginaActual === totalPaginas ? 'disabled' : ''}
        style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;cursor:${paginaActual === totalPaginas ? 'not-allowed' : 'pointer'};opacity:${paginaActual === totalPaginas ? '0.5' : '1'};">
        <span class="material-symbols-outlined" style="font-size:18px;">chevron_right</span>
    </button>`;

    html += '</div>';
    container.innerHTML = html;
}

function getPaginasVisibles(actual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (actual <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (actual >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', actual - 1, actual, actual + 1, '...', total];
}

window.cambiarPagina = function(numero) {
    const totalPaginas = Math.ceil(presupuestosCache.length / ITEMS_POR_PAGINA);
    if (numero < 1 || numero > totalPaginas) return;
    paginaActual = numero;
    renderTabla();
};

// ─── Eventos de botones en cada fila ─────────────────────────────────────────
function adjuntarEventosTabla() {
    // ENVIAR EMAIL
    document.querySelectorAll('.send-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const presupuestoId = parseInt(this.dataset.id);
            await enviarPresupuesto(presupuestoId);
        });
    });

    // EDITAR
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const presupuesto = presupuestosCache.find(p => p.id == this.dataset.id);
            if (!presupuesto) return;
            abrirModalEditar(presupuesto);
        });
    });

    // ELIMINAR
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const presupuesto = presupuestosCache.find(p => p.id == this.dataset.id);
            const nombre = presupuesto?.cliente?.nombre || `Presupuesto #${this.dataset.id}`;

            if (!confirm(`¿Estás seguro de eliminar el presupuesto de ${nombre}?`)) return;

            try {
                await apiCall(`${API.presupuestos}/${this.dataset.id}`, { method: 'DELETE' });
                mostrarToast(`Presupuesto eliminado correctamente.`, 'success');
                await cargarPresupuestos();
            } catch (err) {
                mostrarToast(err.message, 'error');
            }
        });
    });
}

// ─── Enviar presupuesto por email ────────────────────────────────────────────
async function enviarPresupuesto(presupuestoId) {
    if (!confirm('¿Enviar este presupuesto por email al cliente?')) return;

    try {
        await apiCall(`${API.presupuestos}/${presupuestoId}/enviar`, {
            method: 'POST'
        });
        mostrarToast('Presupuesto enviado por email correctamente.', 'success');
        await cargarPresupuestos();
    } catch (err) {
        console.error('Error enviando presupuesto:', err);
        mostrarToast('Error al enviar el presupuesto: ' + err.message, 'error');
    }
}

// ─── Filtro por cliente ──────────────────────────────────────────────────────
function aplicarFiltroCliente() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', function(e) {
        const termino = e.target.value.toLowerCase();
        const filas = document.querySelectorAll('tbody tr');

        filas.forEach(fila => {
            const cliente = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
            fila.style.display = cliente.includes(termino) ? '' : 'none';
        });
    });
}

// ─── Modal crear/editar (placeholder - implementar según necesidad) ─────────
function abrirModalEditar(presupuesto) {
    mostrarToast('Función de edición en desarrollo', 'info');
    console.log('Editar presupuesto:', presupuesto);
}

// ═══════════════════════════════════════════════════════════════════════════
// INIT CON CONFIGURACIÓN DE LOGOUT
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async function () {

    // Verificar autenticación
    if (!AuthService.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // ✅ IMPORTANTE: Configurar el menú de logout
    configurarLogout();

    // Botón añadir presupuesto
    const addBtn = document.getElementById('addBudgetBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            mostrarToast('Función de creación en desarrollo', 'info');
        });
    }

    aplicarFiltroCliente();
    await cargarPresupuestos();

    console.log('✅ Taxicamino - Sistema de gestión de presupuestos conectado.');
});