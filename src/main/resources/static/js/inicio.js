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
    etapas: '/api/etapas'
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
let etapasCache = [];
let fechaSeleccionada = new Date();

// ─── Paginación ──────────────────────────────────────────────────────────────
const ITEMS_POR_PAGINA = 10;
let paginaActual = 1;

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

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE FILTRO DE FECHA
// ═══════════════════════════════════════════════════════════════════════════

function inicializarFiltroFecha() {
    const inputFecha = document.getElementById('fecha-filtro');
    if (inputFecha) {
        inputFecha.value = formatearFechaInput(fechaSeleccionada);
        inputFecha.addEventListener('change', (e) => {
            fechaSeleccionada = new Date(e.target.value + 'T00:00:00');
            cargarEtapasDelDia();
        });
    }

    const btnAyer = document.getElementById('btn-ayer');
    const btnHoy = document.getElementById('btn-hoy');
    const btnManana = document.getElementById('btn-manana');

    if (btnAyer) btnAyer.addEventListener('click', () => cambiarFecha(-1));
    if (btnHoy) btnHoy.addEventListener('click', () => {
        fechaSeleccionada = new Date();
        const inputFecha = document.getElementById('fecha-filtro');
        if (inputFecha) inputFecha.value = formatearFechaInput(fechaSeleccionada);
        cargarEtapasDelDia();
    });
    if (btnManana) btnManana.addEventListener('click', () => cambiarFecha(1));
}

function cambiarFecha(dias) {
    fechaSeleccionada.setDate(fechaSeleccionada.getDate() + dias);
    const inputFecha = document.getElementById('fecha-filtro');
    if (inputFecha) inputFecha.value = formatearFechaInput(fechaSeleccionada);
    cargarEtapasDelDia();
}

function formatearFechaInput(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatearFechaMostrar(fecha) {
    const day = String(fecha.getDate()).padStart(2, '0');
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const year = fecha.getFullYear();
    return `${day}/${month}/${year}`;
}

function actualizarDisplayFecha() {
    const fechaDisplay = document.getElementById('fecha-display');
    if (!fechaDisplay) return;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSel = new Date(fechaSeleccionada);
    fechaSel.setHours(0, 0, 0, 0);

    let textoFecha = formatearFechaMostrar(fechaSeleccionada);

    if (fechaSel.getTime() === hoy.getTime()) {
        textoFecha = `Hoy - ${textoFecha}`;
    } else if (fechaSel.getTime() === hoy.getTime() + 86400000) {
        textoFecha = `Mañana - ${textoFecha}`;
    } else if (fechaSel.getTime() === hoy.getTime() - 86400000) {
        textoFecha = `Ayer - ${textoFecha}`;
    }

    fechaDisplay.textContent = textoFecha;
}

// ─── Cargar etapas del día seleccionado ─────────────────────────────────────
async function cargarEtapasDelDia() {
    try {
        actualizarDisplayFecha();
        const fechaStr = formatearFechaInput(fechaSeleccionada);
        etapasCache = await apiCall(`${API.etapas}/fecha/${fechaStr}`);

        console.log('📦 Etapas recibidas del backend:', etapasCache);

        // Debug: Ver primera etapa en detalle
        if (etapasCache.length > 0) {
            console.log('🔍 Primera etapa en detalle:', {
                id: etapasCache[0].id,
                reserva: etapasCache[0].reserva,
                cliente: etapasCache[0].reserva?.cliente,
                agencia: etapasCache[0].reserva?.agencia,
                empresa: etapasCache[0].reserva?.empresa
            });
        }

        paginaActual = 1;
        renderTabla();
        renderPaginacion();
        actualizarEstadisticas(etapasCache);
    } catch (err) {
        console.error('Error cargando etapas:', err);
        mostrarToast('No se pudieron cargar las etapas.', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERIZAR TABLA CON NUEVO ORDEN DE COLUMNAS
// ═══════════════════════════════════════════════════════════════════════════

function renderTabla() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const pagina = etapasCache.slice(inicio, inicio + ITEMS_POR_PAGINA);

    tbody.innerHTML = '';

    if (pagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="padding:40px 24px;text-align:center;font-size:14px;color:#9ca3af;">
                    No hay etapas programadas para esta fecha.
                </td>
            </tr>`;
        return;
    }

    pagina.forEach(etapa => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/50 transition-colors';
        tr.dataset.etapaId = etapa.id;

        // ✅ Ahora los datos vienen directamente en el DTO plano
        const origen = etapa.origenNombre || 'No especificado';
        const origenCiudad = etapa.origenCiudad || '';

        const destino = etapa.destinoNombre || 'No especificado';
        const destinoCiudad = etapa.destinoCiudad || '';

        const clienteNombre = etapa.clienteNombre || 'Sin cliente';
        const clienteApellidos = etapa.clienteApellidos || '';
        const nombreCompleto = `${clienteNombre} ${clienteApellidos}`.trim();
        const clienteTelefono = etapa.clienteTelefono || '';

        const cantidadMochilas = etapa.cantidadMochilas || 0;
        const precioTotal = etapa.precioTotal || 0;

        const agencia = etapa.agenciaNombre || '-';
        const empresa = etapa.empresaNombre || '-';
        const observaciones = etapa.comentarios || etapa.observaciones || '-';

        // Estado de la etapa
        const estado = etapa.estado || 'Pendiente';
        const estadoClase = estado === 'Completada' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200';
        const estadoIcono = estado === 'Completada' ? 'check_circle' : 'schedule';

        tr.innerHTML = `
            <td class="px-6 py-5">
                <div class="flex flex-col">
                    <span class="text-sm font-semibold text-gray-900">${origen}</span>
                    ${origenCiudad ? `<span class="text-xs text-gray-500">${origenCiudad}</span>` : ''}
                </div>
            </td>
            <td class="px-6 py-5">
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-900">${nombreCompleto}</span>
                    ${clienteTelefono ? `<span class="text-xs text-gray-500">${clienteTelefono}</span>` : ''}
                </div>
            </td>
            <td class="px-6 py-5 text-center">
                <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
                    ${cantidadMochilas}
                </span>
            </td>
            <td class="px-6 py-5 text-right whitespace-nowrap text-sm font-bold text-gray-900">
                €${precioTotal.toFixed(2)}
            </td>
            <td class="px-6 py-5">
                <div class="flex flex-col">
                    <span class="text-sm font-semibold text-gray-900">${destino}</span>
                    ${destinoCiudad ? `<span class="text-xs text-gray-500">${destinoCiudad}</span>` : ''}
                </div>
            </td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                ${agencia}
            </td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                ${empresa}
            </td>
            <td class="px-6 py-5">
                <span class="text-sm text-gray-600 line-clamp-2" title="${observaciones}">
                    ${observaciones}
                </span>
            </td>
            <td class="px-6 py-5 whitespace-nowrap">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoClase}">
                    <span class="material-symbols-outlined" style="font-size:14px;">${estadoIcono}</span>
                    ${estado}
                </span>
            </td>
            <td class="px-6 py-5 whitespace-nowrap">
                <div class="flex items-center gap-2">
                    ${estado !== 'Completada' ? `
                    <button aria-label="Marcar como completada" data-id="${etapa.id}" class="btn-completar flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors border border-green-200">
                        <span class="material-symbols-outlined text-sm">check_circle</span>
                        Completar
                    </button>
                    ` : `
                    <span class="text-xs text-gray-400 italic">Completada</span>
                    `}
                </div>
            </td>`;

        tbody.appendChild(tr);
    });

    adjuntarEventosTabla();
}

// ─── Paginación ──────────────────────────────────────────────────────────────
function renderPaginacion() {
    const contenedor = document.querySelector('.flex.items-center.gap-1');
    if (!contenedor) return;

    const totalPaginas = Math.ceil(etapasCache.length / ITEMS_POR_PAGINA);

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
function actualizarEstadisticas(etapas) {
    const total = etapas.length;
    const totalMochilas = etapas.reduce((sum, e) => sum + (e.cantidadMochilas || 0), 0);
    const totalIngresos = etapas.reduce((sum, e) => sum + (e.precioTotal || 0), 0);

    const totalElem = document.getElementById('total-etapas');
    const mochilasElem = document.getElementById('total-mochilas');
    const ingresosElem = document.getElementById('total-ingresos');

    if (totalElem) totalElem.textContent = total;
    if (mochilasElem) mochilasElem.textContent = totalMochilas;
    if (ingresosElem) ingresosElem.textContent = `€${totalIngresos.toFixed(2)}`;
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

// ─── Eventos de tabla ────────────────────────────────────────────────────────
function adjuntarEventosTabla() {
    document.querySelectorAll('.btn-completar').forEach(btn => {
        btn.addEventListener('click', async function() {
            const etapaId = parseInt(this.dataset.id);

            if (!confirm('¿Marcar esta etapa como completada?')) {
                return;
            }

            try {
                await apiCall(`${API.etapas}/${etapaId}/estado`, {
                    method: 'PUT',
                    body: JSON.stringify({ estado: 'Completada' })
                });

                mostrarToast('Etapa marcada como completada', 'success');
                await cargarEtapasDelDia();
            } catch (err) {
                console.error('Error marcando etapa como completada:', err);
                mostrarToast('Error al completar la etapa: ' + err.message, 'error');
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async function () {

    console.log('Taxicamino - Ruta Diaria iniciando...');

    if (!AuthService.checkAuth()) {
        return;
    }

    const userInfo = AuthService.getUserInfo();
    console.log('👤 Usuario autenticado:', userInfo);

    configurarLogout();
    inicializarFiltroFecha();
    await cargarEtapasDelDia();

    console.log('✅ Ruta Diaria cargada correctamente');
});