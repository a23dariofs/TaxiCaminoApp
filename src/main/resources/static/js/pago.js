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
    facturas:      '/api/facturas',
    lineas:        '/api/lineas-factura',
    reservas:      '/api/reservas',
    clientes:      '/api/clientes',
    agencias:      '/api/agencias'  // ✅ AÑADIDO
};

// ─── Helper: usa AuthService para mandar el token automáticamente ───────────
async function apiCall(url, options = {}) {
    // Añadir Content-Type por defecto si hay body
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
let facturasCache = [];
let facturasCacheFull = [];  // ✅ AÑADIDO: Guardamos TODAS las facturas sin filtrar
let modalClientes = [];
let modalAgencias = [];  // ✅ AÑADIDO
let filtroAgenciaActivo = false;  // ✅ AÑADIDO
let agenciaSeleccionada = null;  // ✅ AÑADIDO: Para generar PDF
let fechaInicio = null;  // ✅ AÑADIDO: Para generar PDF
let fechaFin = null;  // ✅ AÑADIDO: Para generar PDF
let tipoServicioSeleccionado = null;  // ✅ AÑADIDO: Para calcular IVA correcto

// ─── Paginación ──────────────────────────────────────────────────────────────
const ITEMS_POR_PAGINA = 4;
let paginaActual = 1;

// ─── Colores inline para estados ─────────────────────────────────────────────
const ESTADO_STYLES = {
    'PAGADO':    { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    'PENDIENTE': { bg: '#fed7aa', text: '#c2410c', border: '#fdba74' },
    'FALLIDO':   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
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

// ═══════════════════════════════════════════════════════════════════════════
// ✨ NUEVO: Detectar si viene desde aceptación de presupuesto
// ═══════════════════════════════════════════════════════════════════════════
function detectarPresupuestoAceptado() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('mensaje') === 'presupuesto_aceptado') {
        // Mostrar notificación de éxito
        mostrarToast(
            '✅ ¡Presupuesto aceptado correctamente! Se ha creado tu reserva y una factura pendiente de pago. ' +
            'Por favor, realiza el pago para que podamos asignar un repartidor.',
            'success'
        );

        // Limpiar URL para que no vuelva a mostrar el mensaje al recargar
        window.history.replaceState({}, document.title, window.location.pathname);

    } else if (urlParams.get('error')) {
        const error = urlParams.get('error');
        let mensaje = 'Error al procesar el presupuesto';

        switch(error) {
            case 'token_invalido':
                mensaje = '❌ El enlace de aceptación no es válido o ha expirado';
                break;
            case 'ya_aceptado':
                mensaje = '⚠️ Este presupuesto ya ha sido aceptado previamente';
                break;
            case 'error_procesamiento':
                mensaje = '❌ Error al procesar el presupuesto. Contacta con soporte';
                break;
            case 'error_servidor':
                mensaje = '❌ Error del servidor. Intenta nuevamente más tarde';
                break;
        }

        mostrarToast(mensaje, 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ─── Cargar facturas desde el backend ────────────────────────────────────────
async function cargarFacturas() {
    try {
        const todasFacturas = await apiCall(API.facturas);

        // Normalizar: si el backend usa importeTotal, crear alias total
        facturasCacheFull = todasFacturas.map(f => ({
            ...f,
            total: f.total || f.importeTotal || 0
        }));

        facturasCache = [...facturasCacheFull];  // ✅ Copia para filtrar

        paginaActual = 1;
        renderTabla();
        renderPaginacion();
        actualizarEstadisticas();
    } catch (err) {
        console.error('Error cargando facturas:', err);
        mostrarToast('No se pudieron cargar las facturas.', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ✅ NUEVO: MODAL FILTRAR POR AGENCIA
// ═══════════════════════════════════════════════════════════════════════════
async function abrirModalFiltroAgencia() {
    document.querySelector('.modal-overlay')?.remove();

    // Cargar agencias si no las tenemos
    if (modalAgencias.length === 0) {
        try {
            modalAgencias = await apiCall(API.agencias);
        } catch (e) {
            mostrarToast('No se pudieron cargar las agencias.', 'error');
            return;
        }
    }

    const agenciaOpciones = modalAgencias
        .map(a => `<option value="${a.id}">${a.nombre}</option>`)
        .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:520px;margin:0 16px;overflow:hidden;animation:modalIn 0.25s ease forwards;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">Filtrar Pagos por Agencia</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>

            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px;">
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Agencia *</label>
                    <select id="filtro-agencia" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="" disabled selected>Selecciona una agencia</option>
                        ${agenciaOpciones}
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Tipo de Servicio *</label>
                    <select id="filtro-tipo-servicio" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="Viaje Taxi">Viaje Taxi (IVA 10%)</option>
                        <option value="Viaje mochilas">Viaje mochilas (IVA 21%)</option>
                    </select>
                </div>
                <div style="display:flex;gap:16px;">
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Fecha Inicio *</label>
                        <input type="date" id="filtro-fecha-inicio"
                            style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Fecha Fin *</label>
                        <input type="date" id="filtro-fecha-fin"
                            style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                    </div>
                </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 24px;border-top:1px solid #f3f4f6;background:#f9fafb;">
                <button id="btn-limpiar-filtro" style="padding:8px 16px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;font-size:14px;font-weight:500;color:#4b5563;cursor:pointer;">Limpiar Filtros</button>
                <div style="display:flex;gap:12px;">
                    <button class="modal-close" style="padding:8px 16px;border-radius:8px;border:none;background:transparent;font-size:14px;font-weight:500;color:#4b5563;cursor:pointer;">Cancelar</button>
                    <button id="btn-aplicar-filtro" style="padding:8px 20px;border-radius:8px;border:none;background:#1773cf;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                        Aplicar Filtro
                    </button>
                </div>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));

    document.getElementById('btn-aplicar-filtro').addEventListener('click', aplicarFiltroAgencia);
    document.getElementById('btn-limpiar-filtro').addEventListener('click', limpiarFiltroAgencia);
}

async function aplicarFiltroAgencia() {
    const agenciaId = document.getElementById('filtro-agencia')?.value;
    const tipoServicio = document.getElementById('filtro-tipo-servicio')?.value;
    const fechaInicioInput = document.getElementById('filtro-fecha-inicio')?.value;
    const fechaFinInput = document.getElementById('filtro-fecha-fin')?.value;

    if (!agenciaId || !tipoServicio || !fechaInicioInput || !fechaFinInput) {
        mostrarToast('Por favor completa todos los campos.', 'error');
        return;
    }

    agenciaSeleccionada = modalAgencias.find(a => a.id == agenciaId);
    tipoServicioSeleccionado = tipoServicio;
    fechaInicio = new Date(fechaInicioInput);
    fechaFin = new Date(fechaFinInput);
    fechaFin.setHours(23, 59, 59, 999);

    try {
        // Filtrar facturas por agencia, tipo de servicio y fechas
        facturasCache = facturasCacheFull.filter(f => {
            // Filtrar por agencia
            if (!f.agencia || f.agencia.id != agenciaId) return false;

            // Filtrar por tipo de servicio
            if (f.tipoServicio !== tipoServicio) return false;

            // Filtrar por fecha
            const fechaFactura = new Date(f.fechaEmision);
            if (fechaFactura < fechaInicio || fechaFactura > fechaFin) return false;

            return true;
        });

        if (facturasCache.length === 0) {
            mostrarToast(`No se encontraron pagos de tipo "${tipoServicio}" para ${agenciaSeleccionada.nombre} entre ${fechaInicioInput} y ${fechaFinInput}`, 'info');
            document.querySelector('.modal-overlay')?.remove();
            return;
        }

        filtroAgenciaActivo = true;

        document.querySelector('.modal-overlay')?.remove();
        paginaActual = 1;
        renderTabla();
        renderPaginacion();

        mostrarToast(`Mostrando ${facturasCache.length} pagos de tipo "${tipoServicio}" de ${agenciaSeleccionada.nombre}`, 'success');

        // Mostrar badge de filtro activo
        mostrarBadgeFiltroActivo(agenciaSeleccionada.nombre, tipoServicio, fechaInicioInput, fechaFinInput);

    } catch (err) {
        console.error('Error aplicando filtro:', err);
        mostrarToast('Error al aplicar filtro: ' + err.message, 'error');
    }
}

function limpiarFiltroAgencia() {
    facturasCache = [...facturasCacheFull];
    filtroAgenciaActivo = false;
    agenciaSeleccionada = null;
    tipoServicioSeleccionado = null;
    fechaInicio = null;
    fechaFin = null;

    document.querySelector('.modal-overlay')?.remove();
    document.getElementById('filtro-badge')?.remove();

    paginaActual = 1;
    renderTabla();
    renderPaginacion();

    mostrarToast('Filtros eliminados', 'success');
}

// ✅ Exponer función globalmente para onclick
window.limpiarFiltroAgencia = limpiarFiltroAgencia;

// ═══════════════════════════════════════════════════════════════════════════
// ✅ NUEVO: GENERAR FACTURA PDF PARA AGENCIA
// ═══════════════════════════════════════════════════════════════════════════
async function generarFacturaPDFAgencia() {
    if (!agenciaSeleccionada || facturasCache.length === 0) {
        mostrarToast('No hay pagos filtrados para generar la factura', 'error');
        return;
    }

    if (!tipoServicioSeleccionado) {
        mostrarToast('Falta el tipo de servicio para generar la factura', 'error');
        return;
    }

    mostrarToast('Generando factura PDF...', 'info');

    try {
        // Calcular totales con IVA según tipo de servicio
        const subtotal = facturasCache.reduce((sum, f) => sum + (f.total || f.importeTotal || 0), 0);

        // ✅ IVA según tipo de servicio
        const porcentajeIVA = tipoServicioSeleccionado === 'Viaje Taxi' ? 0.10 : 0.21;
        const iva = subtotal * porcentajeIVA;
        const total = subtotal + iva;

        // Preparar datos para el PDF
        const facturaData = {
            agencia: {
                nombre: agenciaSeleccionada.nombre,
                cif: agenciaSeleccionada.cif || '',
                direccion: agenciaSeleccionada.direccion || '',
                telefono: agenciaSeleccionada.telefono || '',
                email: agenciaSeleccionada.email || ''
            },
            tipoServicio: tipoServicioSeleccionado,
            porcentajeIVA: porcentajeIVA * 100, // Para mostrar en PDF (10 o 21)
            fechaInicio: fechaInicio.toISOString().split('T')[0],
            fechaFin: fechaFin.toISOString().split('T')[0],
            fechaEmision: new Date().toISOString().split('T')[0],
            numeroFactura: `TC-AGE-${agenciaSeleccionada.id}-${Date.now()}`,
            pagos: facturasCache.map(f => ({
                id: f.id,
                fecha: f.fechaEmision || f.fechaPago,
                concepto: f.concepto || 'Servicio de taxi',
                cliente: f.cliente?.nombre || '—',
                importe: f.total || f.importeTotal || 0
            })),
            subtotal: subtotal.toFixed(2),
            iva: iva.toFixed(2),
            total: total.toFixed(2)
        };

        // Llamar al endpoint del backend
        const response = await fetch(`${API.facturas}/generar-factura-agencia-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt_token') || localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(facturaData)
        });

        if (!response.ok) {
            throw new Error('Error al generar la factura');
        }

        // Descargar el PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ivaLabel = porcentajeIVA === 0.10 ? 'IVA10' : 'IVA21';
        const nombreArchivo = `Factura_${agenciaSeleccionada.nombre.replace(/\s+/g, '_')}_${tipoServicioSeleccionado.replace(/\s+/g, '_')}_${ivaLabel}_${formatFecha(fechaInicio)}_${formatFecha(fechaFin)}.pdf`;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        mostrarToast(`Factura generada con IVA ${porcentajeIVA * 100}%`, 'success');

    } catch (err) {
        console.error('❌ Error generando factura:', err);
        mostrarToast('Error al generar la factura: ' + err.message, 'error');
    }
}

// ✅ Exponer función globalmente para onclick
window.generarFacturaPDFAgencia = generarFacturaPDFAgencia;

function mostrarBadgeFiltroActivo(agenciaNombre, tipoServicio, fechaInicio, fechaFin) {
    document.getElementById('filtro-badge')?.remove();

    const ivaText = tipoServicio === 'Viaje Taxi' ? 'IVA 10%' : 'IVA 21%';

    const badge = document.createElement('div');
    badge.id = 'filtro-badge';
    badge.style.cssText = 'margin-bottom:16px;padding:12px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;display:flex;align-items:center;justify-content:space-between;';
    badge.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
            <span class="material-symbols-outlined" style="font-size:20px;color:#1d4ed8;">filter_alt</span>
            <span style="font-size:14px;color:#1e40af;">
                <strong>Filtro activo:</strong> ${agenciaNombre} | ${tipoServicio} (${ivaText}) | ${fechaInicio} - ${fechaFin}
            </span>
        </div>
        <div style="display:flex;gap:8px;">
            <button onclick="generarFacturaPDFAgencia()" style="padding:6px 12px;border-radius:6px;border:none;background:#16a34a;color:#fff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;">
                <span class="material-symbols-outlined" style="font-size:16px;">picture_as_pdf</span>
                Factura PDF
            </button>
            <button onclick="limpiarFiltroAgencia()" style="padding:6px 12px;border-radius:6px;border:none;background:#1773cf;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">
                Limpiar
            </button>
        </div>
    `;

    const tabla = document.querySelector('.bg-white.rounded-xl.border');
    if (tabla) {
        tabla.parentNode.insertBefore(badge, tabla);
    }
}

// ─── Renderizar tabla según página actual ───────────────────────────────────
function renderTabla() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const pagina = facturasCache.slice(inicio, inicio + ITEMS_POR_PAGINA);

    tbody.innerHTML = '';

    if (facturasCache.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="padding:40px 24px;text-align:center;font-size:14px;color:#9ca3af;">
                    ${filtroAgenciaActivo ? 'No hay pagos que coincidan con el filtro.' : 'No hay pagos registrados.'}
                </td>
            </tr>`;
        return;
    }

    pagina.forEach(f => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/50 transition-colors';
        tr.dataset.facturaId = f.id;

        const estado = f.estado || 'PENDIENTE';
        const estadoStyle = getEstadoStyle(estado);
        const estadoTexto = estado === 'PAGADO' ? 'Pagado' : estado === 'FALLIDO' ? 'Fallido' : 'Pendiente';

        const fechaPago = f.fechaPago ? formatFecha(f.fechaPago) : '-';
        const metodo = f.metodoPago || 'Sin especificar';

        // Concepto de la factura (primera línea o descripción genérica)
        const concepto = f.lineas && f.lineas.length > 0
            ? f.lineas[0].concepto
            : f.concepto || 'Servicio de taxi';

        const isPagado = estado === 'PAGADO';

        let botonesAccion = '';

        if (isPagado) {
            botonesAccion = `
                <div class="flex items-center gap-2">
                    <button class="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium cursor-not-allowed" disabled>
                        <span class="material-symbols-outlined text-base">check_circle</span>
                        Pagada
                    </button>
                    <button aria-label="Eliminar" data-id="${f.id}"
                        class="delete-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>`;
        } else {
            botonesAccion = `
                <div class="flex items-center gap-2">
                    <button aria-label="Marcar pagada" data-id="${f.id}"
                        class="mark-paid-btn flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
                        <span class="material-symbols-outlined text-base">check</span>
                        Marcar pagada
                    </button>
                    <button aria-label="Editar" data-id="${f.id}"
                        class="edit-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                        <span class="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button aria-label="Eliminar" data-id="${f.id}"
                        class="delete-btn flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>`;
        }

        // Columnas: Cliente | Agencia | Tipo Servicio | Concepto | Fecha Pago | Importe | Método | Estado | Acciones
        tr.innerHTML = `
            <td class="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">${f.cliente?.nombre || '—'}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${f.agencia?.nombre || '—'}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${f.tipoServicio === 'Viaje mochilas' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">
                    ${f.tipoServicio || 'Viaje Taxi'}
                </span>
            </td>
            <td class="px-6 py-5 text-sm text-gray-600">${concepto}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${fechaPago}</td>
            <td class="px-6 py-5 text-right whitespace-nowrap text-sm font-bold text-gray-900">€${f.total?.toFixed(2) || '0.00'}</td>
            <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${metodo}</td>
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
    const d   = new Date(isoDate);
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
    }, 5000);
}

// ─── Renderizar paginación ──────────────────────────────────────────────────
function renderPaginacion() {
    const totalPaginas = Math.ceil(facturasCache.length / ITEMS_POR_PAGINA);
    const container = document.querySelector('.pagination-container');

    if (!container || totalPaginas <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    const paginas = getPaginasVisibles(paginaActual, totalPaginas);

    let html = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:24px;">';

    // Botón anterior
    html += `<button onclick="cambiarPagina(${paginaActual - 1})"
        ${paginaActual === 1 ? 'disabled' : ''}
        style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:14px;font-weight:500;cursor:${paginaActual === 1 ? 'not-allowed' : 'pointer'};opacity:${paginaActual === 1 ? '0.5' : '1'};">
        <span class="material-symbols-outlined" style="font-size:18px;">chevron_left</span>
    </button>`;

    // Números de página
    paginas.forEach(p => {
        if (p === '...') {
            html += '<span style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;color:#9ca3af;font-size:14px;">...</span>';
        } else {
            const isActive = p === paginaActual;
            html += `<button onclick="cambiarPagina(${p})"
                style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;border-radius:8px;border:1px solid ${isActive ? '#1773cf' : '#e5e7eb'};background:${isActive ? '#1773cf' : '#fff'};color:${isActive ? '#fff' : '#6b7280'};font-size:14px;font-weight:${isActive ? '700' : '500'};cursor:pointer;">
                ${p}
            </button>`;
        }
    });

    // Botón siguiente
    html += `<button onclick="cambiarPagina(${paginaActual + 1})"
        ${paginaActual === totalPaginas ? 'disabled' : ''}
        style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:14px;font-weight:500;cursor:${paginaActual === totalPaginas ? 'not-allowed' : 'pointer'};opacity:${paginaActual === totalPaginas ? '0.5' : '1'};">
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
    const totalPaginas = Math.ceil(facturasCache.length / ITEMS_POR_PAGINA);
    if (numero < 1 || numero > totalPaginas) return;
    paginaActual = numero;
    renderTabla();
};

// ─── Actualizar estadísticas mensuales ───────────────────────────────────────
function actualizarEstadisticas() {
    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();

    const facturasMes = facturasCache.filter(f => {
        if (!f.fechaEmision) return false;
        const fecha = new Date(f.fechaEmision);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    });

    const totalMes = facturasMes.reduce((sum, f) => sum + (f.total || 0), 0);

    const totalElement = document.querySelector('.text-4xl.font-black');
    if (totalElement) {
        totalElement.textContent = `€${totalMes.toFixed(2)}`;
    }
}

// ─── Modal editar factura ────────────────────────────────────────────────────
function crearModalEditar(factura) {
    document.querySelector('.modal-overlay')?.remove();

    const clienteOpciones = modalClientes
        .map(c => `<option value="${c.id}" ${c.id === factura.cliente?.id ? 'selected' : ''}>${c.nombre}</option>`)
        .join('');

    const agenciaOpciones = modalAgencias
        .map(a => `<option value="${a.id}" ${a.id === factura.agencia?.id ? 'selected' : ''}>${a.nombre}</option>`)
        .join('');

    const concepto = factura.lineas && factura.lineas.length > 0
        ? factura.lineas[0].concepto
        : factura.concepto || '';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:520px;margin:0 16px;overflow:hidden;animation:modalIn 0.25s ease forwards;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">Editar Pago</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>

            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px;max-height:65vh;overflow-y:auto;">
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Cliente</label>
                    <select id="modal-cliente" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        ${clienteOpciones}
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Agencia</label>
                    <select id="modal-agencia" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="">Sin agencia</option>
                        ${agenciaOpciones}
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Tipo de Servicio</label>
                    <select id="modal-tipo-servicio" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="Viaje Taxi" ${factura.tipoServicio === 'Viaje Taxi' || !factura.tipoServicio ? 'selected' : ''}>Viaje Taxi</option>
                        <option value="Viaje mochilas" ${factura.tipoServicio === 'Viaje mochilas' ? 'selected' : ''}>Viaje mochilas</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Concepto</label>
                    <input type="text" id="modal-concepto" value="${concepto}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div style="display:flex;gap:16px;">
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Importe (€)</label>
                        <input type="number" id="modal-importe" step="0.01" min="0" value="${factura.total || 0}"
                            style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Método de Pago</label>
                        <select id="modal-metodo" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                            <option value="Efectivo" ${factura.metodoPago === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                            <option value="Transferencia" ${factura.metodoPago === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
                            <option value="Bizum" ${factura.metodoPago === 'Bizum' ? 'selected' : ''}>Bizum</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Estado</label>
                    <select id="modal-estado" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="PENDIENTE" ${factura.estado === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
                        <option value="PAGADO" ${factura.estado === 'PAGADO' ? 'selected' : ''}>Pagado</option>
                        <option value="FALLIDO" ${factura.estado === 'FALLIDO' ? 'selected' : ''}>Fallido</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Fecha de Pago</label>
                    <input type="date" id="modal-fecha"
                        value="${factura.fechaPago ? factura.fechaPago.split('T')[0] : new Date().toISOString().split('T')[0]}"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #f3f4f6;background:#f9fafb;">
                <button class="modal-close" style="padding:8px 16px;border-radius:8px;border:none;background:transparent;font-size:14px;font-weight:500;color:#4b5563;cursor:pointer;">Cancelar</button>
                <button id="modal-submit-edit" data-id="${factura.id}" style="padding:8px 20px;border-radius:8px;border:none;background:#1773cf;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    Guardar Cambios
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));
    overlay.querySelector('#modal-submit-edit').addEventListener('click', handleModalEditSubmit);
}

// ─── Submit modal editar ─────────────────────────────────────────────────────
async function handleModalEditSubmit() {
    const facturaId = this.dataset.id;
    const clienteId = document.getElementById('modal-cliente')?.value;
    const agenciaId = document.getElementById('modal-agencia')?.value;
    const tipoServicio = document.getElementById('modal-tipo-servicio')?.value;
    const concepto  = document.getElementById('modal-concepto')?.value.trim();
    const importe   = document.getElementById('modal-importe')?.value;
    const metodo    = document.getElementById('modal-metodo')?.value;
    const estado    = document.getElementById('modal-estado')?.value;
    const fecha     = document.getElementById('modal-fecha')?.value;

    if (!clienteId || !concepto || !importe) {
        mostrarToast('Cliente, concepto e importe son obligatorios.', 'error');
        return;
    }

    try {
        const facturaOriginal = facturasCacheFull.find(f => f.id == facturaId);

        const facturaActualizada = {
            fechaEmision: facturaOriginal.fechaEmision,
            fechaPago: fecha || null,
            importeTotal: parseFloat(importe),
            estado: estado,
            metodoPago: metodo,
            concepto: concepto,
            tipoServicio: tipoServicio,
            agenciaId: agenciaId ? parseInt(agenciaId) : null
        };

        await apiCall(`${API.facturas}/${facturaId}`, {
            method: 'PUT',
            body: JSON.stringify(facturaActualizada)
        });

        document.querySelector('.modal-overlay')?.remove();
        mostrarToast('Pago actualizado correctamente.', 'success');
        await cargarFacturas();

    } catch (err) {
        console.error('Error actualizando pago:', err);
        mostrarToast(err.message, 'error');
    }
}

// ─── Modal añadir pago manualmente ───────────────────────────────────────────
function crearModal() {
    document.querySelector('.modal-overlay')?.remove();

    const clienteOpciones = modalClientes
        .map(c => `<option value="${c.id}">${c.nombre}</option>`)
        .join('');

    const agenciaOpciones = modalAgencias
        .map(a => `<option value="${a.id}">${a.nombre}</option>`)
        .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:50;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease forwards;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);width:100%;max-width:520px;margin:0 16px;overflow:hidden;animation:modalIn 0.25s ease forwards;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6;">
                <h3 style="font-size:18px;font-weight:700;color:#111827;">Añadir Pago Manualmente</h3>
                <button class="modal-close" style="display:flex;height:32px;width:32px;align-items:center;justify-content:center;border-radius:8px;border:none;background:transparent;color:#9ca3af;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                </button>
            </div>

            <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px;max-height:65vh;overflow-y:auto;">
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Cliente *</label>
                    <select id="modal-cliente" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="" disabled selected>Selecciona un cliente</option>
                        ${clienteOpciones}
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Agencia</label>
                    <select id="modal-agencia" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="">Sin agencia</option>
                        ${agenciaOpciones}
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Tipo de Servicio *</label>
                    <select id="modal-tipo-servicio" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                        <option value="Viaje Taxi">Viaje Taxi</option>
                        <option value="Viaje mochilas">Viaje mochilas</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Concepto *</label>
                    <input type="text" id="modal-concepto" placeholder="Ej. Ruta Aeropuerto - Hotel"
                        style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                </div>
                <div style="display:flex;gap:16px;">
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Importe (€) *</label>
                        <input type="number" id="modal-importe" step="0.01" min="0" placeholder="0.00"
                            style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <label style="display:block;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Método de Pago</label>
                        <select id="modal-metodo" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;color:#1f2937;outline:none;background:#fff;">
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Bizum">Bizum</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid #f3f4f6;background:#f9fafb;">
                <button class="modal-close" style="padding:8px 16px;border-radius:8px;border:none;background:transparent;font-size:14px;font-weight:500;color:#4b5563;cursor:pointer;">Cancelar</button>
                <button id="modal-submit" style="padding:8px 20px;border-radius:8px;border:none;background:#1773cf;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    Registrar Pago
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => overlay.remove()));
    overlay.querySelector('#modal-submit').addEventListener('click', handleModalSubmit);
}

// ─── Submit modal añadir pago ────────────────────────────────────────────────
async function handleModalSubmit() {
    const clienteId = document.getElementById('modal-cliente')?.value;
    const agenciaId = document.getElementById('modal-agencia')?.value;
    const tipoServicio = document.getElementById('modal-tipo-servicio')?.value;
    const concepto  = document.getElementById('modal-concepto')?.value.trim();
    const importe   = document.getElementById('modal-importe')?.value;
    const metodo    = document.getElementById('modal-metodo')?.value;

    if (!clienteId || !concepto || !importe) {
        mostrarToast('Cliente, concepto e importe son obligatorios.', 'error');
        return;
    }

    try {
        const nuevaFactura = {
            fechaEmision: new Date().toISOString().split('T')[0],
            fechaPago: null,
            importeTotal: parseFloat(importe),
            estado: 'PENDIENTE',
            metodoPago: metodo,
            concepto: concepto,
            tipoServicio: tipoServicio,
            agenciaId: agenciaId ? parseInt(agenciaId) : null
        };

        await apiCall(`${API.facturas}/cliente/${clienteId}`, {
            method: 'POST',
            body: JSON.stringify(nuevaFactura)
        });

        document.querySelector('.modal-overlay')?.remove();
        mostrarToast('Pago registrado correctamente como PENDIENTE.', 'success');
        await cargarFacturas();

    } catch (err) {
        console.error('Error registrando pago:', err);
        mostrarToast(err.message, 'error');
    }
}

// ─── Eventos de botones en cada fila ─────────────────────────────────────────
function adjuntarEventosTabla() {

    // MARCAR COMO PAGADA
    document.querySelectorAll('.mark-paid-btn').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            const facturaId = this.dataset.id;
            const factura = facturasCacheFull.find(f => f.id == facturaId);
            const nombre = factura?.cliente?.nombre || `Factura #${facturaId}`;

            if (!confirm(`¿Confirmar que el pago de ${nombre} ha sido completado?`)) return;

            try {
                const facturaActualizada = {
                    fechaEmision: factura.fechaEmision,
                    fechaPago: new Date().toISOString().split('T')[0],
                    importeTotal: factura.total || factura.importeTotal,
                    estado: 'PAGADO',
                    metodoPago: factura.metodoPago || 'Efectivo',
                    concepto: factura.concepto
                };

                await apiCall(`${API.facturas}/${facturaId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(facturaActualizada)
                });

                mostrarToast(`Pago de ${nombre} marcado como completado.`, 'success');
                await cargarFacturas();
            } catch (err) {
                console.error('Error marcando como pagada:', err);
                mostrarToast('Error: ' + err.message, 'error');
            }
        });
    });

    // EDITAR
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const factura = facturasCacheFull.find(f => f.id == this.dataset.id);
            if (!factura) return;

            if (modalClientes.length === 0) {
                try { modalClientes = await apiCall(API.clientes); }
                catch (e) { mostrarToast('No se pudieron cargar los clientes.', 'error'); return; }
            }

            if (modalAgencias.length === 0) {
                try { modalAgencias = await apiCall(API.agencias); }
                catch (e) { mostrarToast('No se pudieron cargar las agencias.', 'error'); return; }
            }

            crearModalEditar(factura);
        });
    });

    // ELIMINAR
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const factura = facturasCacheFull.find(f => f.id == this.dataset.id);
            const nombre = factura?.cliente?.nombre || `Factura #${this.dataset.id}`;

            if (!confirm(`¿Estás seguro de eliminar el pago de ${nombre}?`)) return;

            try {
                await apiCall(`${API.facturas}/${this.dataset.id}`, { method: 'DELETE' });
                mostrarToast(`Pago de ${nombre} eliminado correctamente.`, 'success');
                await cargarFacturas();
            } catch (err) {
                mostrarToast(err.message, 'error');
            }
        });
    });
}

// ─── Filtro por cliente ──────────────────────────────────────────────────────
function aplicarFiltroCliente() {
    const input = document.querySelector('input[placeholder*="cliente"]');
    if (!input) return;

    input.addEventListener('input', function(e) {
        const termino = e.target.value.toLowerCase();
        const filas = document.querySelectorAll('tbody tr');

        filas.forEach(fila => {
            const nombreCliente = fila.querySelector('td:first-child')?.textContent.toLowerCase() || '';
            fila.style.display = nombreCliente.includes(termino) ? '' : 'none';
        });
    });
}

// ─── Descargar facturas del mes en PDF ───────────────────────────────────────
async function descargarFacturasMes() {
    if (facturasCache.length === 0) {
        mostrarToast('No hay facturas para descargar.', 'info');
        return;
    }

    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();

    let facturasMes = facturasCache.filter(f => {
        if (!f.fechaEmision) return false;
        const fecha = new Date(f.fechaEmision);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    });

    if (facturasMes.length === 0) {
        facturasMes = facturasCache;
    }

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Facturas ${meses[mesActual]} ${añoActual}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #1773cf; border-bottom: 3px solid #1773cf; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #1773cf; color: white; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; text-align: right; }
        </style>
    </head>
    <body>
        <h1>Facturas - Taxicamino</h1>
        <p><strong>Total de facturas:</strong> ${facturasMes.length}</p>
        <table>
            <thead>
                <tr>
                    <th>Nº</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Método</th>
                    <th>Estado</th>
                    <th>Importe</th>
                </tr>
            </thead>
            <tbody>`;

    let total = 0;
    facturasMes.forEach((f, i) => {
        const concepto = f.lineas && f.lineas.length > 0 ? f.lineas[0].concepto : f.concepto || 'Servicio de taxi';
        total += f.total || 0;
        html += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${f.cliente?.nombre || '—'}</td>
                    <td>${formatFecha(f.fechaPago || f.fechaEmision)}</td>
                    <td>${concepto}</td>
                    <td>${f.metodoPago || '—'}</td>
                    <td>${f.estado || 'PENDIENTE'}</td>
                    <td>€${(f.total || 0).toFixed(2)}</td>
                </tr>`;
    });

    html += `
            </tbody>
        </table>
        <div class="total">Total: €${total.toFixed(2)}</div>
    </body>
    </html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facturas_${meses[mesActual]}_${añoActual}.html`;
    a.click();
    URL.revokeObjectURL(url);

    mostrarToast(`${facturasMes.length} facturas descargadas correctamente.`, 'success');
}

// ─── Descargar informe para gestoría ─────────────────────────────────────────
async function descargarInformeGestoria() {
    if (facturasCache.length === 0) {
        mostrarToast('No hay facturas para generar el informe.', 'info');
        return;
    }

    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();

    let facturasMes = facturasCache.filter(f => {
        if (!f.fechaEmision) return false;
        const fecha = new Date(f.fechaEmision);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    });

    if (facturasMes.length === 0) {
        facturasMes = facturasCache;
    }

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    let csv = 'Nº Factura,Cliente,Fecha Emisión,Fecha Pago,Concepto,Método Pago,Estado,Importe\n';

    facturasMes.forEach(f => {
        const concepto = (f.lineas && f.lineas.length > 0 ? f.lineas[0].concepto : f.concepto || 'Servicio de taxi').replace(/"/g, '""');
        csv += `${f.id},"${f.cliente?.nombre || '—'}","${formatFecha(f.fechaEmision)}","${formatFecha(f.fechaPago)}","${concepto}","${f.metodoPago || '—'}","${f.estado || 'PENDIENTE'}",${(f.total || 0).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe_Gestoria_${meses[mesActual]}_${añoActual}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    mostrarToast(`Informe con ${facturasMes.length} facturas descargado correctamente.`, 'success');
}

// ─── Renderizar gráfico de estadísticas ──────────────────────────────────────
function renderGraficoEstadisticas() {
    const container = document.querySelector('.w-full.h-48.bg-gray-50');
    if (!container) return;

    if (facturasCache.length === 0) {
        container.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:14px;">
                <span>No hay datos para mostrar</span>
            </div>`;
        return;
    }

    const mesActual = new Date().getMonth();
    const añoActual = new Date().getFullYear();

    const facturasMes = facturasCache.filter(f => {
        if (!f.fechaEmision) return false;
        const fecha = new Date(f.fechaEmision);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    });

    if (facturasMes.length === 0) {
        container.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:14px;">
                <span>No hay datos para este mes</span>
            </div>`;
        return;
    }

    const diasDelMes = new Date(añoActual, mesActual + 1, 0).getDate();
    const ingresosPorDia = Array(diasDelMes).fill(0);

    facturasMes.forEach(f => {
        const fecha = f.fechaPago || f.fechaEmision;
        if (fecha) {
            const dia = new Date(fecha).getDate() - 1;
            if (dia >= 0 && dia < diasDelMes) {
                ingresosPorDia[dia] += f.total || 0;
            }
        }
    });

    const maxIngreso = Math.max(...ingresosPorDia, 1);

    let html = '<div style="display:flex;align-items:flex-end;justify-content:space-between;height:100%;padding:20px 10px;gap:3px;">';

    ingresosPorDia.forEach((ingreso, i) => {
        const altura = maxIngreso > 0 ? (ingreso / maxIngreso) * 100 : 0;
        const color = ingreso > 0 ? '#1773cf' : '#e5e7eb';
        html += `<div style="flex:1;background:${color};height:${altura}%;border-radius:3px 3px 0 0;min-height:4px;transition:all 0.3s;" title="Día ${i + 1}: €${ingreso.toFixed(2)}"></div>`;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// ✨ INIT CON DETECCIÓN DE PRESUPUESTO ACEPTADO Y CONFIGURACIÓN DE LOGOUT
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async function () {

    // Verificar autenticación
    if (!AuthService.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // ✨ IMPORTANTE: Detectar si viene desde aceptación de presupuesto
    detectarPresupuestoAceptado();

    // ✅ IMPORTANTE: Configurar el menú de logout
    configurarLogout();

    // ✅ AÑADIR BOTÓN DE FILTRAR POR AGENCIA
    const addBtn = document.getElementById('addPaymentBtn');
    if (addBtn) {
        // Crear botón de filtrar
        const btnFiltrar = document.createElement('button');
        btnFiltrar.id = 'filterAgencyBtn';
        btnFiltrar.className = 'flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-all shadow-sm';
        btnFiltrar.innerHTML = `
            <span class="material-symbols-outlined text-lg">filter_alt</span>
            <span>Filtrar por Agencia</span>
        `;

        // Insertar después del botón de añadir pago
        addBtn.parentNode.insertBefore(btnFiltrar, addBtn.nextSibling);

        // Event listener
        btnFiltrar.addEventListener('click', abrirModalFiltroAgencia);
    }

    // Botón añadir pago manualmente
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            if (modalClientes.length === 0) {
                try { modalClientes = await apiCall(API.clientes); }
                catch (e) { mostrarToast('No se pudieron cargar los clientes.', 'error'); return; }
            }
            if (modalAgencias.length === 0) {
                try { modalAgencias = await apiCall(API.agencias); }
                catch (e) { mostrarToast('No se pudieron cargar las agencias.', 'error'); return; }
            }
            crearModal();
        });
    }

    // Selector de mes
    const monthSelector = document.querySelector('select[class*="py-2"]');
    if (monthSelector) {
        monthSelector.addEventListener('change', () => {
            actualizarEstadisticas();
            renderGraficoEstadisticas();
        });
    }

    // Botones de descarga
    const btnFacturasPDF = document.querySelector('button[class*="bg-primary"]');
    if (btnFacturasPDF && btnFacturasPDF.textContent.includes('Facturas del Mes')) {
        btnFacturasPDF.addEventListener('click', descargarFacturasMes);
    }

    const btnInformeGestoria = document.querySelector('button[class*="bg-gray-50"]');
    if (btnInformeGestoria && btnInformeGestoria.textContent.includes('Informe para Gestoría')) {
        btnInformeGestoria.addEventListener('click', descargarInformeGestoria);
    }

    aplicarFiltroCliente();
    await cargarFacturas();
    renderGraficoEstadisticas();

    console.log('✅ Taxicamino - Sistema de gestión de pagos conectado a la API.');
});