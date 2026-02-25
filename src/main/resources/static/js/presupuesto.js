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

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE API
// ═══════════════════════════════════════════════════════════════════════════
const API = {
    presupuestos: '/api/presupuestos',
    clientes:     '/api/clientes',
    albergues:    '/api/albergues'
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER DE API
// ═══════════════════════════════════════════════════════════════════════════
async function apiCall(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }

    if (options.body) {
        if (typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }
        options.headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('jwt_token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(url, options);

        if (res.status === 401) {
            console.warn('Token expirado o inválido');
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_info');
            window.location.href = '/login.html';
            throw new Error('Sesión expirada');
        }

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Error ${res.status}: ${errText || res.statusText}`);
        }

        if (res.status === 204) {
            return null;
        }

        return await res.json();
    } catch (err) {
        if (err.message === 'Failed to fetch') {
            throw new Error('Error de conexión con el servidor');
        }
        throw err;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTADO LOCAL
// ═══════════════════════════════════════════════════════════════════════════
let presupuestosCache = [];
let clientesCache = [];
let paginaActual = 1;
const ITEMS_POR_PAGINA = 5;

// ═══════════════════════════════════════════════════════════════════════════
// ESTILOS DE ESTADOS
// ═══════════════════════════════════════════════════════════════════════════
const ESTADO_STYLES = {
    'ACEPTADO':  'bg-green-50 text-green-700 border-green-200',
    'PENDIENTE': 'bg-blue-50 text-blue-700 border-blue-200',
    'ENVIADO':   'bg-blue-50 text-blue-700 border-blue-200',
    'RECHAZADO': 'bg-red-50 text-red-700 border-red-200',
    'EXPIRADO':  'bg-gray-100 text-gray-600 border-gray-200',
    'CADUCADO':  'bg-gray-100 text-gray-600 border-gray-200'
};

function getEstadoCss(estado) {
    return ESTADO_STYLES[estado?.toUpperCase()] || ESTADO_STYLES['PENDIENTE'];
}

function getEstadoTexto(estado) {
    const textos = {
        'ACEPTADO': 'Aceptado',
        'PENDIENTE': 'Pendiente',
        'ENVIADO': 'Enviado',
        'RECHAZADO': 'Rechazado',
        'EXPIRADO': 'Caducado',
        'CADUCADO': 'Caducado'
    };
    return textos[estado?.toUpperCase()] || 'Pendiente';
}

// ═══════════════════════════════════════════════════════════════════════════
// MENÚ DE USUARIO
// ═══════════════════════════════════════════════════════════════════════════
function configurarLogout() {
    const userButton = document.querySelector('header button[class*="rounded-full"]');
    if (userButton) {
        userButton.addEventListener('click', mostrarMenuUsuario);
    }
}

function mostrarMenuUsuario(e) {
    e.stopPropagation();

    const menuExistente = document.getElementById('userMenu');
    if (menuExistente) {
        menuExistente.remove();
        return;
    }

    let userInfo = { username: 'Usuario', role: 'USER' };
    try {
        userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    } catch(e) {
        console.warn('No se pudo parsear user_info');
    }

    const menu = document.createElement('div');
    menu.id = 'userMenu';
    menu.className = 'absolute top-16 right-10 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 min-w-[200px]';
    menu.innerHTML = `
        <div class="px-4 py-2 border-b border-gray-100">
            <p class="text-sm font-semibold text-gray-900">${userInfo.username || 'Usuario'}</p>
            <p class="text-xs text-gray-500">${userInfo.role || 'USER'}</p>
        </div>
        <button id="logoutBtn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">logout</span>
            <span>Cerrar sesión</span>
        </button>
    `;

    document.body.appendChild(menu);

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_info');
        window.location.href = '/login.html';
    });

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
// CARGAR DATOS
// ═══════════════════════════════════════════════════════════════════════════
async function cargarPresupuestos() {
    console.log('📥 Cargando presupuestos...');
    try {
        const data = await apiCall(API.presupuestos);
        presupuestosCache = data || [];
        console.log(`✅ ${presupuestosCache.length} presupuestos cargados`);
        paginaActual = 1;
        renderTabla();
        renderPaginacion();
    } catch (err) {
        console.error('❌ Error cargando presupuestos:', err);
        presupuestosCache = [];
        renderTabla();
        mostrarToast('Error al cargar presupuestos: ' + err.message, 'error');
    }
}

async function cargarClientes() {
    try {
        const data = await apiCall(API.clientes);
        clientesCache = data || [];
        console.log(`✅ ${clientesCache.length} clientes cargados`);
    } catch (err) {
        console.error('❌ Error cargando clientes:', err);
        clientesCache = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERIZAR TABLA
// ═══════════════════════════════════════════════════════════════════════════
function renderTabla() {
    const tbody = document.getElementById('budgetsTableBody');
    if (!tbody) {
        console.warn('⚠️ No se encontró el tbody');
        return;
    }

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const pagina = presupuestosCache.slice(inicio, inicio + ITEMS_POR_PAGINA);

    tbody.innerHTML = '';

    if (presupuestosCache.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                        <span class="material-symbols-outlined text-5xl text-gray-300">description</span>
                        <p class="text-gray-500 text-sm">No hay presupuestos registrados</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    pagina.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/50 transition-colors';
        tr.dataset.presupuestoId = p.id;

        const estado = p.estado || 'PENDIENTE';
        const estadoCss = getEstadoCss(estado);
        const estadoTexto = getEstadoTexto(estado);

        const cliente = p.cliente?.nombre || '—';
        const fechaViaje = p.fechaViaje ? formatFecha(p.fechaViaje) : '—';
        const origen = p.origen || '';
        const destino = p.destino || '';
        const origenDestino = (origen && destino) ? `${origen} - ${destino}` : '—';
        const km = p.km != null ? `${p.km} km` : '—';
        const precio = p.importeTotal != null ? `€${p.importeTotal.toFixed(2)}` : '€0.00';
        const fechaCreacion = p.fechaEmision ? formatFecha(p.fechaEmision) : '—';

        tr.innerHTML = `
            <td class="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">${cliente}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${fechaViaje}</td>
            <td class="px-6 py-5 text-sm text-gray-600 max-w-xs truncate">${origenDestino}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${km}</td>
            <td class="px-6 py-5 text-right whitespace-nowrap text-sm font-bold text-gray-900">${precio}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${fechaCreacion}</td>
            <td class="px-6 py-5 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoCss}">
                    ${estadoTexto}
                </span>
            </td>
            <td class="px-6 py-5 whitespace-nowrap">
                <div class="flex items-center gap-2">
                    <button aria-label="Editar" data-id="${p.id}" class="edit-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                        <span class="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button aria-label="Eliminar" data-id="${p.id}" class="delete-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                    <button aria-label="Enviar presupuesto" data-id="${p.id}" class="send-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <span class="material-symbols-outlined text-base">mail</span>
                    </button>
                    <button aria-label="Convertir en Reserva" data-id="${p.id}" class="reserve-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors">
                        <span class="material-symbols-outlined text-base">bookmark_add</span>
                    </button>
                </div>
            </td>`;

        tbody.appendChild(tr);
    });

    adjuntarEventosTabla();
}

function formatFecha(isoDate) {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL DE CREAR/EDITAR PRESUPUESTO
// ═══════════════════════════════════════════════════════════════════════════
function abrirModalPresupuesto(presupuestoId = null) {
    const esEdicion = presupuestoId !== null;
    const presupuesto = esEdicion ? presupuestosCache.find(p => p.id === presupuestoId) : null;

    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'modalPresupuesto';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-xl font-bold text-gray-900">${esEdicion ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}</h3>
                <button onclick="cerrarModal()" class="text-gray-400 hover:text-gray-600">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <form id="formPresupuesto" class="p-6 space-y-4">
                <!-- Cliente -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                    <select id="clienteId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                        <option value="">Seleccionar cliente...</option>
                        ${clientesCache.map(c => `
                            <option value="${c.id}" ${presupuesto?.cliente?.id === c.id ? 'selected' : ''}>
                                ${c.nombre} - ${c.email}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <!-- Fechas -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha de Viaje *</label>
                        <input type="date" id="fechaViaje" required value="${presupuesto?.fechaViaje || ''}"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha de Emisión *</label>
                        <input type="date" id="fechaEmision" required value="${presupuesto?.fechaEmision || new Date().toISOString().split('T')[0]}"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                    </div>
                </div>

                <!-- Origen y Destino -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Origen *</label>
                        <input type="text" id="origen" required value="${presupuesto?.origen || ''}" placeholder="Ej: Aeropuerto"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Destino *</label>
                        <input type="text" id="destino" required value="${presupuesto?.destino || ''}" placeholder="Ej: Hotel Central"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                    </div>
                </div>

                <!-- KM y Precio -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Kilómetros Estimados *</label>
                        <input type="number" id="km" required value="${presupuesto?.km || ''}" min="0" step="0.1"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Precio Total (€) *</label>
                        <input type="number" id="importeTotal" required value="${presupuesto?.importeTotal || ''}" min="0" step="0.01"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                    </div>
                </div>

                <!-- Observaciones -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
                    <textarea id="observaciones" rows="3" placeholder="Notas adicionales sobre el presupuesto..."
                              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">${presupuesto?.observaciones || ''}</textarea>
                </div>

                <!-- Botones -->
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button type="button" onclick="cerrarModal()" class="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                        Cancelar
                    </button>
                    <button type="submit" class="px-5 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-bold flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg">save</span>
                        <span>${esEdicion ? 'Guardar Cambios' : 'Crear Presupuesto'}</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Manejar envío del formulario
    document.getElementById('formPresupuesto').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarPresupuesto(presupuestoId);
    });

    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });
}

async function guardarPresupuesto(presupuestoId) {
    const formData = {
        clienteId: parseInt(document.getElementById('clienteId').value),
        fechaViaje: document.getElementById('fechaViaje').value,
        fechaEmision: document.getElementById('fechaEmision').value,
        origen: document.getElementById('origen').value,
        destino: document.getElementById('destino').value,
        km: parseFloat(document.getElementById('km').value),
        importeTotal: parseFloat(document.getElementById('importeTotal').value),
        observaciones: document.getElementById('observaciones').value || null,
        estado: presupuestoId ? undefined : 'PENDIENTE' // Solo en creación
    };

    console.log('📤 Guardando presupuesto:', formData);

    try {
        if (presupuestoId) {
            // Editar existente
            await apiCall(`${API.presupuestos}/${presupuestoId}`, {
                method: 'PUT',
                body: formData
            });
            mostrarToast('Presupuesto actualizado correctamente', 'success');
        } else {
            // Crear nuevo
            await apiCall(API.presupuestos, {
                method: 'POST',
                body: formData
            });
            mostrarToast('Presupuesto creado correctamente', 'success');
        }

        cerrarModal();
        await cargarPresupuestos();
    } catch (err) {
        console.error('❌ Error guardando presupuesto:', err);
        mostrarToast('Error al guardar: ' + err.message, 'error');
    }
}

window.cerrarModal = function() {
    const modal = document.getElementById('modalPresupuesto');
    if (modal) {
        modal.remove();
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// PAGINACIÓN
// ═══════════════════════════════════════════════════════════════════════════
function renderPaginacion() {
    const totalPaginas = Math.ceil(presupuestosCache.length / ITEMS_POR_PAGINA);
    const container = document.querySelector('.pagination-container');

    if (!container) return;

    if (totalPaginas <= 1) {
        container.innerHTML = '';
        return;
    }

    const paginas = getPaginasVisibles(paginaActual, totalPaginas);

    let html = '<div class="flex items-center justify-center gap-2">';

    html += `
        <button onclick="cambiarPagina(${paginaActual - 1})"
            ${paginaActual === 1 ? 'disabled' : ''}
            class="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-gray-50 transition-colors ${paginaActual === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}">
            <span class="material-symbols-outlined text-xl">chevron_left</span>
        </button>`;

    paginas.forEach(p => {
        if (p === '...') {
            html += '<span class="flex h-8 w-8 items-center justify-center text-gray-600">...</span>';
        } else {
            const isActive = p === paginaActual;
            html += `
                <button onclick="cambiarPagina(${p})"
                    class="flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors
                    ${isActive ? 'bg-primary text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}">
                    ${p}
                </button>`;
        }
    });

    html += `
        <button onclick="cambiarPagina(${paginaActual + 1})"
            ${paginaActual === totalPaginas ? 'disabled' : ''}
            class="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-gray-50 transition-colors ${paginaActual === totalPaginas ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}">
            <span class="material-symbols-outlined text-xl">chevron_right</span>
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
    renderPaginacion();
};

// ═══════════════════════════════════════════════════════════════════════════
// EVENTOS DE BOTONES
// ═══════════════════════════════════════════════════════════════════════════
function adjuntarEventosTabla() {
    // Botón Enviar
    document.querySelectorAll('.send-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            await enviarPresupuesto(parseInt(this.dataset.id));
        });
    });

    // Botón Editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = parseInt(this.dataset.id);
            console.log('✏️ Editando presupuesto:', id);
            abrirModalPresupuesto(id);
        });
    });

    // Botón Convertir en Reserva
    document.querySelectorAll('.reserve-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarToast('Función de convertir a reserva en desarrollo', 'info');
        });
    });

    // Botón Eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            const id = this.dataset.id;

            const presupuesto = presupuestosCache.find(p => p.id == id);
            const cliente = presupuesto?.cliente?.nombre || `Presupuesto #${id}`;

            if (!confirm(`¿Estás seguro de eliminar el presupuesto de ${cliente}?`)) {
                return;
            }

            try {
                await apiCall(`${API.presupuestos}/${id}`, { method: 'DELETE' });
                mostrarToast('Presupuesto eliminado correctamente', 'success');
                await cargarPresupuestos();
            } catch (err) {
                console.error('❌ Error eliminando presupuesto:', err);
                mostrarToast('Error al eliminar: ' + err.message, 'error');
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// ENVIAR PRESUPUESTO
// ═══════════════════════════════════════════════════════════════════════════
async function enviarPresupuesto(presupuestoId) {
    if (!confirm('¿Enviar este presupuesto por email al cliente?')) return;

    try {
        await apiCall(`${API.presupuestos}/${presupuestoId}/enviar`, { method: 'POST' });
        mostrarToast('Presupuesto enviado por email correctamente', 'success');
        await cargarPresupuestos();
    } catch (err) {
        console.error('❌ Error enviando presupuesto:', err);
        mostrarToast('Error al enviar: ' + err.message, 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTRO DE BÚSQUEDA
// ═══════════════════════════════════════════════════════════════════════════
function aplicarFiltroCliente() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', function(e) {
        const termino = e.target.value.toLowerCase();
        const filas = document.querySelectorAll('#budgetsTableBody tr');

        filas.forEach(fila => {
            const cliente = fila.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
            fila.style.display = cliente.includes(termino) ? '' : 'none';
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST (NOTIFICACIONES)
// ═══════════════════════════════════════════════════════════════════════════
function mostrarToast(msg, tipo = 'info') {
    document.querySelector('.toast-notif')?.remove();

    const colores = {
        error:   { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', icono: 'error' },
        success: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', icono: 'check_circle' },
        info:    { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', icono: 'info' }
    };

    const c = colores[tipo] || colores.info;

    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        border-radius: 12px;
        border: 1px solid ${c.border};
        background-color: ${c.bg};
        color: ${c.text};
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: toastIn 0.3s ease forwards;
    `;

    toast.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:20px;">${c.icono}</span>
        <span>${msg}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ═══════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando sistema de presupuestos...');

    const token = localStorage.getItem('jwt_token');
    if (!token) {
        console.warn('⚠️ No hay token JWT - redirigiendo a login');
        window.location.href = '/login.html';
        return;
    }

    configurarLogout();

    // Botón CREAR presupuesto
    const addBtn = document.getElementById('addBudgetBtn');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('➕ Abriendo modal de creación');
            abrirModalPresupuesto();
        });
    }

    aplicarFiltroCliente();

    // Cargar datos
    await Promise.all([
        cargarClientes(),
        cargarPresupuestos()
    ]);

    console.log('✅ Sistema cargado completamente');
});

// ═══════════════════════════════════════════════════════════════════════════
// FILTRO DE BÚSQUEDA
// ═══════════════════════════════════════════════════════════════════════════
function aplicarFiltroCliente() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', function(e) {
        const termino = e.target.value.toLowerCase();
        const filas = document.querySelectorAll('#budgetsTableBody tr');

        filas.forEach(fila => {
            const cliente = fila.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
            fila.style.display = cliente.includes(termino) ? '' : 'none';
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST (NOTIFICACIONES)
// ═══════════════════════════════════════════════════════════════════════════
function mostrarToast(msg, tipo = 'info') {
    document.querySelector('.toast-notif')?.remove();

    const colores = {
        error:   { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', icono: 'error' },
        success: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', icono: 'check_circle' },
        info:    { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', icono: 'info' }
    };

    const c = colores[tipo] || colores.info;

    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        border-radius: 12px;
        border: 1px solid ${c.border};
        background-color: ${c.bg};
        color: ${c.text};
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: toastIn 0.3s ease forwards;
    `;

    toast.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:20px;">${c.icono}</span>
        <span>${msg}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ═══════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando sistema de presupuestos...');

    const token = localStorage.getItem('jwt_token');
    if (!token) {
        console.warn('⚠️ No hay token JWT - redirigiendo a login');
        window.location.href = '/login.html';
        return;
    }

    configurarLogout();

    // Botón CREAR presupuesto
    const addBtn = document.getElementById('addBudgetBtn');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('➕ Abriendo modal de creación');
            abrirModalPresupuesto();
        });
    }

    aplicarFiltroCliente();

    // Cargar datos
    await Promise.all([
        cargarClientes(),
        cargarPresupuestos()
    ]);

    console.log('✅ Sistema cargado completamente');
});