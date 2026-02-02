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
// ============================================
// GESTIÓN DE CLIENTES CON AUTENTICACIÓN JWT
// ============================================

// ============================================
// VERIFICAR AUTENTICACIÓN AL CARGAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Taxicamino - Sistema de gestión de clientes iniciando...');

    // Verificar que el usuario esté autenticado
    if (!AuthService.checkAuth()) {
        return; // Si no está autenticado, checkAuth() redirige al login
    }

    // Mostrar información del usuario
    const userInfo = AuthService.getUserInfo();
    console.log('👤 Usuario autenticado:', userInfo);

    await inicializarApp();
});

// ============================================
// SERVICIOS API - CLIENTES (CON JWT)
// ============================================
const ClienteService = {
    async listarTodos() {
        try {
            const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/clientes`, {
                method: 'GET'
            });

            if (!response.ok) throw new Error('Error al obtener clientes');
            return await response.json();
        } catch (error) {
            console.error('Error en listarTodos:', error);
            throw error;
        }
    },

    async buscarPorId(id) {
        try {
            const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/clientes/${id}`, {
                method: 'GET'
            });

            if (!response.ok) throw new Error('Error al obtener el cliente');
            return await response.json();
        } catch (error) {
            console.error('Error en buscarPorId:', error);
            throw error;
        }
    },

    async buscarPorNombre(nombre) {
        try {
            const response = await AuthService.authenticatedFetch(
                `${API_BASE_URL}/clientes/buscar?nombre=${encodeURIComponent(nombre)}`,
                { method: 'GET' }
            );

            if (!response.ok) throw new Error('Error al buscar cliente');
            return await response.json();
        } catch (error) {
            console.error('Error en buscarPorNombre:', error);
            throw error;
        }
    },

    async crear(cliente) {
        try {
            const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/clientes`, {
                method: 'POST',
                body: JSON.stringify(cliente)
            });

            if (!response.ok) throw new Error('Error al crear el cliente');
            return await response.json();
        } catch (error) {
            console.error('Error en crear:', error);
            throw error;
        }
    },

    async actualizar(id, cliente) {
        try {
            const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/clientes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(cliente)
            });

            if (!response.ok) throw new Error('Error al actualizar el cliente');
            return await response.json();
        } catch (error) {
            console.error('Error en actualizar:', error);
            throw error;
        }
    },

    async eliminar(id) {
        try {
            const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/clientes/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar el cliente');
            return true;
        } catch (error) {
            console.error('Error en eliminar:', error);
            throw error;
        }
    }
};

// ============================================
// SERVICIOS API - ALBERGUES (CON JWT)
// ============================================
const AlbergueService = {
    async listarTodos() {
        try {
            const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/albergues`, {
                method: 'GET'
            });

            if (!response.ok) throw new Error('Error al obtener albergues');
            return await response.json();
        } catch (error) {
            console.error('Error en listarTodos:', error);
            throw error;
        }
    },

    async buscarPorId(id) {
        try {
            const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/albergues/${id}`, {
                method: 'GET'
            });

            if (!response.ok) throw new Error('Error al obtener el albergue');
            return await response.json();
        } catch (error) {
            console.error('Error en buscarPorId:', error);
            throw error;
        }
    },

    async buscarPorCiudad(ciudad) {
        try {
            const response = await AuthService.authenticatedFetch(
                `${API_BASE_URL}/albergues/ciudad/${encodeURIComponent(ciudad)}`,
                { method: 'GET' }
            );

            if (!response.ok) throw new Error('Error al buscar por ciudad');
            return await response.json();
        } catch (error) {
            console.error('Error en buscarPorCiudad:', error);
            throw error;
        }
    },

    async buscarPorProvincia(provincia) {
        try {
            const response = await AuthService.authenticatedFetch(
                `${API_BASE_URL}/albergues/provincia/${encodeURIComponent(provincia)}`,
                { method: 'GET' }
            );

            if (!response.ok) throw new Error('Error al buscar por provincia');
            return await response.json();
        } catch (error) {
            console.error('Error en buscarPorProvincia:', error);
            throw error;
        }
    }
};

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
let clientesActuales = [];
let clienteEditando = null;

// ============================================
// INICIALIZACIÓN
// ============================================
async function inicializarApp() {
    try {
        // Configurar botón de logout en el header
        configurarLogout();

        // Cargar clientes desde el backend
        await cargarClientes();

        // Configurar event listeners
        configurarEventListeners();

        console.log('Taxicamino - Sistema de gestión de clientes cargado correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        mostrarNotificacion('Error al cargar los datos iniciales', 'error');
    }
}

// ============================================
// CONFIGURACIÓN DE LOGOUT
// ============================================
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

// ============================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ============================================
function configurarEventListeners() {
    // Búsqueda de clientes
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarClientesLocal);
    }

    // Botón añadir nuevo cliente
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', abrirModalCrearCliente);
    }
}

// ============================================
// FUNCIONES PARA CARGAR DATOS
// ============================================
async function cargarClientes() {
    try {
        mostrarCargandoTabla();
        const clientes = await ClienteService.listarTodos();
        clientesActuales = clientes;
        console.log('Clientes cargados:', clientes);
        renderizarClientes(clientes);
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        mostrarErrorTabla('No se pudieron cargar los clientes. Intenta nuevamente.');
    }
}

// ============================================
// RENDERIZADO DE CLIENTES EN LA TABLA
// ============================================
function renderizarClientes(clientes) {
    const tbody = document.getElementById('clientsTableBody');

    if (!tbody) {
        console.error('No se encontró el tbody de la tabla');
        return;
    }

    if (clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                        <span class="material-symbols-outlined text-5xl text-gray-300">people</span>
                        <p class="text-gray-500 font-medium">No hay clientes registrados</p>
                        <button onclick="abrirModalCrearCliente()" class="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Añadir Primer Cliente
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clientes.map(cliente => {
        const nombre = cliente.nombre || 'Sin nombre';
        const apellidos = cliente.apellidos || '';
        const nombreCompleto = `${nombre} ${apellidos}`.trim();
        const telefono = cliente.telefono || 'Sin teléfono';
        const email = cliente.email || 'Sin email';
        const notas = cliente.notas || cliente.observaciones || 'Sin notas';

        return `
            <tr class="hover:bg-gray-50/50 transition-colors" data-cliente-id="${cliente.id}">
                <td class="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">${nombreCompleto}</td>
                <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${telefono}</td>
                <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-600">${email}</td>
                <td class="px-6 py-5 text-sm text-gray-600">${notas}</td>
                <td class="px-6 py-5 whitespace-nowrap">
                    <div class="flex items-center gap-4">
                        <button
                            onclick="editarCliente(${cliente.id})"
                            aria-label="Editar cliente"
                            class="text-primary hover:text-blue-800 text-sm font-semibold flex items-center gap-1 transition-colors">
                            <span class="material-symbols-outlined text-base">edit</span> Editar
                        </button>
                        <button
                            onclick="eliminarCliente(${cliente.id}, '${nombreCompleto.replace(/'/g, "\\'")}' )"
                            aria-label="Eliminar cliente"
                            class="text-red-600 hover:text-red-800 text-sm font-semibold flex items-center gap-1 transition-colors">
                            <span class="material-symbols-outlined text-base">delete</span> Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// FUNCIONES DE BÚSQUEDA Y FILTRADO
// ============================================
function filtrarClientesLocal(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        renderizarClientes(clientesActuales);
        return;
    }

    const clientesFiltrados = clientesActuales.filter(cliente => {
        const nombre = `${cliente.nombre || ''} ${cliente.apellidos || ''}`.toLowerCase();
        const telefono = (cliente.telefono || '').toLowerCase();
        const email = (cliente.email || '').toLowerCase();
        const notas = (cliente.notas || cliente.observaciones || '').toLowerCase();

        return nombre.includes(searchTerm) ||
               telefono.includes(searchTerm) ||
               email.includes(searchTerm) ||
               notas.includes(searchTerm);
    });

    renderizarClientes(clientesFiltrados);
}

// ============================================
// FUNCIONES DE ACCIONES (CRUD)
// ============================================
async function editarCliente(clienteId) {
    try {
        const cliente = await ClienteService.buscarPorId(clienteId);
        console.log('Editar cliente:', cliente);
        clienteEditando = cliente;
        abrirModalEditarCliente(cliente);
    } catch (error) {
        console.error('Error al cargar cliente:', error);
        mostrarNotificacion('Error al cargar el cliente', 'error');
    }
}

async function eliminarCliente(clienteId, nombreCliente) {
    if (!confirm(`¿Estás seguro de que deseas eliminar al cliente ${nombreCliente}?`)) {
        return;
    }

    try {
        await ClienteService.eliminar(clienteId);
        mostrarNotificacion('Cliente eliminado exitosamente', 'success');
        await cargarClientes();
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        mostrarNotificacion('Error al eliminar el cliente', 'error');
    }
}

function abrirModalCrearCliente() {
    console.log('Abrir modal para crear cliente');

    // Crear el modal dinámicamente
    const modal = crearModalCliente();
    document.body.appendChild(modal);

    // Configurar el formulario para crear
    const form = document.getElementById('clienteForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        await crearCliente();
    };
}

function abrirModalEditarCliente(cliente) {
    console.log('Abrir modal para editar cliente:', cliente);

    // Crear el modal dinámicamente
    const modal = crearModalCliente(cliente);
    document.body.appendChild(modal);

    // Configurar el formulario para editar
    const form = document.getElementById('clienteForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        await actualizarCliente(cliente.id);
    };
}

async function crearCliente() {
    const nuevoCliente = {
        nombre: document.getElementById('modalNombre').value,
        apellidos: document.getElementById('modalApellidos').value,
        telefono: document.getElementById('modalTelefono').value,
        email: document.getElementById('modalEmail').value,
        notas: document.getElementById('modalNotas').value
    };

    try {
        const clienteCreado = await ClienteService.crear(nuevoCliente);
        console.log('Cliente creado:', clienteCreado);
        mostrarNotificacion('Cliente creado exitosamente', 'success');
        cerrarModal();
        await cargarClientes();
    } catch (error) {
        console.error('Error al crear cliente:', error);
        mostrarNotificacion('Error al crear el cliente: ' + error.message, 'error');
    }
}

async function actualizarCliente(clienteId) {
    const clienteActualizado = {
        nombre: document.getElementById('modalNombre').value,
        apellidos: document.getElementById('modalApellidos').value,
        telefono: document.getElementById('modalTelefono').value,
        email: document.getElementById('modalEmail').value,
        notas: document.getElementById('modalNotas').value
    };

    try {
        const cliente = await ClienteService.actualizar(clienteId, clienteActualizado);
        console.log('Cliente actualizado:', cliente);
        mostrarNotificacion('Cliente actualizado exitosamente', 'success');
        cerrarModal();
        await cargarClientes();
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        mostrarNotificacion('Error al actualizar el cliente: ' + error.message, 'error');
    }
}

// ============================================
// FUNCIONES DE MODAL
// ============================================
function crearModalCliente(cliente = null) {
    const esEdicion = cliente !== null;
    const titulo = esEdicion ? 'Editar Cliente' : 'Añadir Nuevo Cliente';
    const botonTexto = esEdicion ? 'Guardar Cambios' : 'Crear Cliente';

    const modal = document.createElement('div');
    modal.id = 'clienteModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 class="text-xl font-bold text-gray-900">${titulo}</h3>
                <button onclick="cerrarModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <form id="clienteForm" class="p-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                        <input
                            type="text"
                            id="modalNombre"
                            required
                            value="${cliente?.nombre || ''}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Nombre del cliente"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                        <input
                            type="text"
                            id="modalApellidos"
                            value="${cliente?.apellidos || ''}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Apellidos del cliente"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                        <input
                            type="tel"
                            id="modalTelefono"
                            required
                            value="${cliente?.telefono || ''}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="+34 612 345 678"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            id="modalEmail"
                            value="${cliente?.email || ''}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="email@ejemplo.com"
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Notas / Observaciones</label>
                    <textarea
                        id="modalNotas"
                        rows="4"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Información adicional sobre el cliente..."
                    >${cliente?.notas || cliente?.observaciones || ''}</textarea>
                </div>

                <div class="flex gap-3 pt-4">
                    <button
                        type="submit"
                        class="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                        ${botonTexto}
                    </button>
                    <button
                        type="button"
                        onclick="cerrarModal()"
                        class="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    `;

    // Cerrar modal al hacer clic en el fondo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cerrarModal();
        }
    });

    return modal;
}

function cerrarModal() {
    const modal = document.getElementById('clienteModal');
    if (modal) {
        modal.classList.add('animate-fade-out');
        setTimeout(() => modal.remove(), 200);
    }
    clienteEditando = null;
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
function mostrarCargandoTabla() {
    const tbody = document.getElementById('clientsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                        <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                        <p class="text-gray-600 font-medium">Cargando clientes...</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function mostrarErrorTabla(mensaje) {
    const tbody = document.getElementById('clientsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                        <span class="material-symbols-outlined text-5xl text-red-400">error</span>
                        <p class="text-red-600 font-medium">${mensaje}</p>
                        <button onclick="cargarClientes()" class="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Reintentar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const colores = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-orange-500'
    };

    const iconos = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning'
    };

    const notificacion = document.createElement('div');
    notificacion.className = `fixed top-4 right-4 ${colores[tipo]} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-in`;
    notificacion.innerHTML = `
        <span class="material-symbols-outlined">${iconos[tipo]}</span>
        <span class="font-medium">${mensaje}</span>
    `;

    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.classList.add('animate-slide-out');
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// ============================================
// ESTILOS PARA ANIMACIONES
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    @keyframes slide-up {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slide-out {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .animate-fade-in {
        animation: fade-in 0.2s ease-out;
    }

    .animate-fade-out {
        animation: fade-out 0.2s ease-in;
    }

    .animate-slide-up {
        animation: slide-up 0.3s ease-out;
    }

    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }

    .animate-slide-out {
        animation: slide-out 0.3s ease-in;
    }
`;
document.head.appendChild(style);

// Exponer funciones globalmente para que puedan ser llamadas desde el HTML
window.editarCliente = editarCliente;
window.eliminarCliente = eliminarCliente;
window.abrirModalCrearCliente = abrirModalCrearCliente;
window.cerrarModal = cerrarModal;
window.cargarClientes = cargarClientes;