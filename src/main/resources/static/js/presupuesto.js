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
    clientes:     '/api/clientes'
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER DE API - SIN REDIRECCIÓN AUTOMÁTICA
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

        // ⚠️ NO REDIRIGIR AUTOMÁTICAMENTE EN 401
        // Solo lanzar error y dejar que se maneje arriba
        if (res.status === 401) {
            console.warn('Token expirado o inválido');
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
let etapasCounter = 0;
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
        console.log(`✅ ${presupuestosCache.length} presupuestos cargados:`, presupuestosCache);
        paginaActual = 1;
        renderTabla();
        renderPaginacion();
    } catch (err) {
        console.error('❌ Error cargando presupuestos:', err);

        // Solo redirigir si es error de sesión
        if (err.message === 'Sesión expirada') {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_info');
            window.location.href = '/login.html';
            return;
        }

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
                <td colspan="7" class="px-6 py-12 text-center">
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

        // Calcular ruta desde etapas
        const etapas = p.etapas || [];
        let ruta = '—';
        if (etapas.length > 0) {
            const primera = etapas[0];
            const ultima = etapas[etapas.length - 1];
            ruta = `${primera.origen || '—'} → ${ultima.destino || '—'} (${etapas.length} etapas)`;
        }

        // Calcular total de mochilas
        const totalMochilas = etapas.reduce((sum, e) => sum + (e.numeroMochilas || 0), 0);

        const precio = p.importeTotal != null ? `€${p.importeTotal.toFixed(2)}` : '€0.00';

        tr.innerHTML = `
            <td class="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">${cliente}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${fechaViaje}</td>
            <td class="px-6 py-5 text-sm text-gray-600 max-w-xs truncate">${ruta}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600 text-center">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    🎒 ${totalMochilas}
                </span>
            </td>
            <td class="px-6 py-5 text-right whitespace-nowrap text-sm font-bold text-gray-900">${precio}</td>
            <td class="px-6 py-5 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoCss}">
                    ${estadoTexto}
                </span>
            </td>
            <td class="px-6 py-5 whitespace-nowrap">
                <div class="flex items-center gap-2">
                    <button aria-label="Ver detalles" data-id="${p.id}" class="view-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                        <span class="material-symbols-outlined text-base">visibility</span>
                    </button>
                    <button aria-label="Eliminar" data-id="${p.id}" class="delete-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                    <button aria-label="Enviar presupuesto" data-id="${p.id}" class="send-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <span class="material-symbols-outlined text-base">mail</span>
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
// MODAL DE CREAR PRESUPUESTO (ESTILO RESERVAS)
// ═══════════════════════════════════════════════════════════════════════════
function crearModalPresupuesto() {
    document.querySelector('.modal-overlay')?.remove();

    etapasCounter = 0;

    const clienteOpciones = clientesCache
        .map(c => `<option value="${c.id}">${c.nombre} ${c.apellidos || ''} - ${c.email || c.telefono}</option>`)
        .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;overflow-y:auto;padding:20px;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:900px;margin:auto;overflow:hidden;animation:modalIn 0.25s ease forwards;">

            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">Nuevo Presupuesto del Camino</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>

            <!-- Body -->
            <div style="padding:20px 24px;max-height:70vh;overflow-y:auto;">

                <!-- Datos Cliente -->
                <div style="margin-bottom:24px;">
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Cliente *</label>
                    <select id="modal-cliente-id" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="">Seleccionar cliente...</option>
                        ${clienteOpciones}
                    </select>
                </div>

                <div style="margin-bottom:24px;">
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Observaciones</label>
                    <textarea id="modal-observaciones" rows="2" placeholder="Observaciones/notas del presupuesto" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;resize:vertical;"></textarea>
                </div>

                <!-- Etapas -->
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
                <button id="modal-submit-presupuesto" style="padding:8px 20px;border-radius:8px;border:none;background:#1773cf;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    Crear Presupuesto
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
    document.getElementById('modal-submit-presupuesto').addEventListener('click', handleSubmitPresupuesto);
}

function añadirEtapa() {
    const container = document.getElementById('etapas-container');
    const index = etapasCounter++;

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
                    <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Nº Mochilas</label>
                    <input type="number" class="etapa-cantidad" data-index="${index}" min="1" value="1" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
                </div>
                <div>
                    <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Precio €</label>
                    <input type="number" class="etapa-precio" data-index="${index}" value="6.00" step="0.01" min="0" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                    <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Origen *</label>
                    <input type="text" class="etapa-origen" data-index="${index}" placeholder="Ej: Sarria" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
                </div>
                <div>
                    <label style="display:block;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Destino *</label>
                    <input type="text" class="etapa-destino" data-index="${index}" placeholder="Ej: Portomarín" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #e5e7eb;font-size:13px;color:#1f2937;outline:none;">
                </div>
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
        const inputOrigen = siguienteEtapa.querySelector('.etapa-origen');
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

async function handleSubmitPresupuesto() {
    const clienteId = document.getElementById('modal-cliente-id').value;
    const observaciones = document.getElementById('modal-observaciones').value.trim();

    // Validar cliente
    if (!clienteId) {
        mostrarToast('Debes seleccionar un cliente.', 'error');
        return;
    }

    // Recoger etapas
    const etapas = [];
    const etapasItems = document.querySelectorAll('.etapa-item');

    if (etapasItems.length === 0) {
        mostrarToast('Añade al menos una etapa del Camino.', 'error');
        return;
    }

    let fechaViajeInicio = null;

    etapasItems.forEach((etapa, i) => {
        const fecha = etapa.querySelector('.etapa-fecha').value;
        const origen = etapa.querySelector('.etapa-origen').value.trim();
        const destino = etapa.querySelector('.etapa-destino').value.trim();
        const cantidad = parseInt(etapa.querySelector('.etapa-cantidad').value) || 0;
        const precio = parseFloat(etapa.querySelector('.etapa-precio').value) || 6.0;

        if (!origen || !destino) {
            mostrarToast(`La etapa ${i + 1} necesita origen y destino.`, 'error');
            throw new Error('Etapa incompleta');
        }

        if (i === 0) {
            fechaViajeInicio = fecha || new Date().toISOString().split('T')[0];
        }

        etapas.push({
            fecha: fecha || null,
            numeroMochilas: cantidad,
            precioUnitario: precio,
            origen: origen,
            destino: destino,
            orden: i + 1
        });
    });

    // Calcular precio total
    const importeTotal = etapas.reduce((sum, e) => sum + (e.numeroMochilas * e.precioUnitario), 0);

    // Crear DTO
    const presupuestoDTO = {
        cliente: { id: parseInt(clienteId) },
        fechaViaje: fechaViajeInicio,
        fechaEmision: new Date().toISOString().split('T')[0],
        importeTotal: importeTotal,
        observaciones: observaciones || null,
        estado: 'PENDIENTE',
        etapas: etapas
    };

    console.log('📤 Enviando presupuesto:', presupuestoDTO);

    try {
        await apiCall(API.presupuestos, {
            method: 'POST',
            body: presupuestoDTO
        });

        document.querySelector('.modal-overlay')?.remove();
        mostrarToast('Presupuesto creado correctamente con ' + etapas.length + ' etapas.', 'success');
        await cargarPresupuestos();
    } catch (err) {
        console.error('Error creando presupuesto:', err);
        mostrarToast(err.message, 'error');
    }
}

// ✅ MODAL PARA VER DETALLES DE PRESUPUESTO
function verDetallesPresupuesto(presupuestoId) {
    const presupuesto = presupuestosCache.find(p => p.id === presupuestoId);
    if (!presupuesto) return;

    const etapas = presupuesto.etapas || [];
    const totalMochilas = etapas.reduce((sum, e) => sum + (e.numeroMochilas || 0), 0);

    const modal = document.createElement('div');
    modal.id = 'modalDetalles';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-xl font-bold text-gray-900">Detalles del Presupuesto</h3>
                <button onclick="document.getElementById('modalDetalles').remove()" class="text-gray-400 hover:text-gray-600">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="p-6 space-y-6">
                <!-- Info general -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-500">Cliente</p>
                        <p class="font-semibold text-gray-900">${presupuesto.cliente?.nombre || '—'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Fecha de Viaje</p>
                        <p class="font-semibold text-gray-900">${formatFecha(presupuesto.fechaViaje)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Precio Total</p>
                        <p class="font-bold text-green-600 text-lg">€${presupuesto.importeTotal?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Total Mochilas</p>
                        <p class="font-semibold text-purple-600">🎒 ${totalMochilas}</p>
                    </div>
                </div>

                <!-- Etapas -->
                <div>
                    <h4 class="font-bold text-gray-900 mb-3">📍 Etapas del Viaje:</h4>
                    <div class="space-y-3">
                        ${etapas.map((e, idx) => `
                            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-bold text-primary">Etapa ${idx + 1}</span>
                                    <span class="text-sm text-gray-600">${formatFecha(e.fecha)}</span>
                                </div>
                                <div class="grid grid-cols-4 gap-2 text-sm">
                                    <div>
                                        <span class="text-gray-500">Origen:</span>
                                        <p class="font-semibold">${e.origen || '—'}</p>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Destino:</span>
                                        <p class="font-semibold">${e.destino || '—'}</p>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Mochilas:</span>
                                        <p class="font-semibold text-purple-600">🎒 ${e.numeroMochilas || 0}</p>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">Precio:</span>
                                        <p class="font-semibold text-green-600">€${((e.numeroMochilas || 0) * (e.precioUnitario || 0)).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${presupuesto.observaciones ? `
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Observaciones</p>
                        <p class="text-gray-900">${presupuesto.observaciones}</p>
                    </div>
                ` : ''}
            </div>

            <div class="px-6 py-4 bg-gray-50 border-t flex justify-end">
                <button onclick="document.getElementById('modalDetalles').remove()" class="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

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
    // Botón Ver Detalles
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            verDetallesPresupuesto(parseInt(this.dataset.id));
        });
    });

    // Botón Enviar
    document.querySelectorAll('.send-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            await enviarPresupuesto(parseInt(this.dataset.id));
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
// INICIALIZACIÓN - SIN REDIRECCIÓN AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando sistema de presupuestos...');

    // ✅ SOLO VERIFICAR TOKEN - NO REDIRIGIR AUTOMÁTICAMENTE
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        console.warn('⚠️ No hay token JWT');
        // MOSTRAR MENSAJE EN LA PÁGINA EN VEZ DE REDIRIGIR
        mostrarToast('Sesión no iniciada. Redirigiendo al login...', 'error');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return;
    }

    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

    configurarLogout();

    // Botón CREAR presupuesto
    const addBtn = document.getElementById('addBudgetBtn');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('➕ Abriendo modal de creación');
            crearModalPresupuesto();
        });
    }

    aplicarFiltroCliente();

    // Cargar datos
    try {
        await Promise.all([
            cargarClientes(),
            cargarPresupuestos()
        ]);
        console.log('✅ Sistema cargado completamente');
    } catch (err) {
        console.error('❌ Error en inicialización:', err);
        if (err.message === 'Sesión expirada') {
            mostrarToast('Tu sesión ha expirado. Redirigiendo al login...', 'error');
            setTimeout(() => {
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_info');
                window.location.href = '/login.html';
            }, 2000);
        }
    }
});