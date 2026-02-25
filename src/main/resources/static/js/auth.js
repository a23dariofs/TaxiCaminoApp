// ============================================
// SERVICIO DE AUTENTICACIÓN JWT - CORREGIDO
// ============================================
const API_BASE_URL = 'http://localhost:8080/api';

const AuthService = {
    // ============================================
    // GESTIÓN DE TOKENS
    // ============================================

    /**
     * Obtener el token JWT del almacenamiento
     */
    getToken() {
        // Soportar AMBOS nombres: jwt_token (nuevo) y authToken (antiguo)
        return localStorage.getItem('jwt_token') ||
               localStorage.getItem('authToken') ||
               sessionStorage.getItem('authToken');
    },

    /**
     * Guardar el token JWT
     * @param {string} token - Token JWT
     * @param {boolean} remember - Si es true, guarda en localStorage (persistente)
     */
    setToken(token, remember = false) {
        if (remember) {
            localStorage.setItem('jwt_token', token);
            localStorage.setItem('authToken', token); // Compatibilidad
            sessionStorage.removeItem('authToken');
        } else {
            sessionStorage.setItem('authToken', token);
            localStorage.setItem('jwt_token', token); // Para mantener compatibilidad
            localStorage.removeItem('authToken');
        }
    },

    /**
     * Eliminar el token (logout)
     */
    removeToken() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user_info');
    },

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Verificar si el token ha expirado
        try {
            const payload = this.decodeToken(token);
            const now = Date.now() / 1000;
            return payload.exp > now;
        } catch (error) {
            return false;
        }
    },

    /**
     * Decodificar el token JWT (solo payload, no valida firma)
     */
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error al decodificar token:', error);
            return null;
        }
    },

    /**
     * Obtener información del usuario del token
     */
    getUserInfo() {
        const token = this.getToken();
        if (!token) return null;

        const payload = this.decodeToken(token);
        if (!payload) return null;

        return {
            username: payload.sub,
            role: payload.role,
            exp: payload.exp,
            iat: payload.iat
        };
    },

    /**
     * Obtener headers con autenticación para las peticiones
     */
    getAuthHeaders() {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    },

    // ============================================
    // OPERACIONES DE AUTENTICACIÓN
    // ============================================

    /**
     * Iniciar sesión
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @param {boolean} remember - Recordar sesión
     * @returns {Promise<boolean>} - true si el login fue exitoso
     */
    async login(username, password, remember = false) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Usuario o contraseña incorrectos');
                }
                throw new Error('Error al iniciar sesión');
            }

            const data = await response.json();

            if (data.token) {
                this.setToken(data.token, remember);

                // Guardar información del usuario
                const userInfo = this.getUserInfo();
                if (userInfo) {
                    localStorage.setItem('username', userInfo.username);
                    localStorage.setItem('userRole', userInfo.role);
                    localStorage.setItem('user_info', JSON.stringify(userInfo));
                }

                console.log('✅ Login exitoso:', userInfo);
                return true;
            }

            throw new Error('No se recibió el token');
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    },

    /**
     * Registrar nuevo usuario
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @param {string} role - Rol del usuario (ej: "ADMIN", "USER")
     * @returns {Promise<boolean>}
     */
    async register(username, password, role = 'USER') {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, role })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al registrar usuario');
            }

            const message = await response.text();
            console.log('✅ Registro exitoso:', message);
            return true;
        } catch (error) {
            console.error('❌ Error en registro:', error);
            throw error;
        }
    },

    /**
     * Cerrar sesión
     */
    logout() {
        this.removeToken();
        console.log('✅ Sesión cerrada');
        window.location.href = '/login.html';
    },

    /**
     * Verificar autenticación y redirigir si es necesario
     * Llamar esta función al inicio de cada página protegida
     */
    checkAuth() {
        if (!this.isAuthenticated()) {
            console.log('⚠️ No autenticado, redirigiendo al login...');
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    /**
     * Hacer petición autenticada - VERSIÓN CORREGIDA SIN LOOP
     * @param {string} url - URL del endpoint
     * @param {object} options - Opciones de fetch
     * @returns {Promise<Response>}
     */
    async authenticatedFetch(url, options = {}) {
        // Agregar headers de autenticación
        options.headers = {
            ...this.getAuthHeaders(),
            ...(options.headers || {})
        };

        try {
            const response = await fetch(url, options);

            // Si es 401 o 403, la sesión expiró
            // PERO NO REDIRIGIR AQUÍ - dejar que lo maneje el código que llama
            if (response.status === 401 || response.status === 403) {
                console.error('⚠️ Token inválido o expirado (401/403)');
                // NO llamar a logout() aquí para evitar loop infinito
                // Solo lanzar el error
                throw new Error('Sesión expirada');
            }

            return response;
        } catch (error) {
            // NO redirigir aquí tampoco
            console.error('❌ Error en petición autenticada:', error);
            throw error;
        }
    },

    /**
     * Verificar el servidor (ping)
     */
    async ping() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/ping`);
            const message = await response.text();
            console.log('🏓 Ping:', message);
            return message;
        } catch (error) {
            console.error('❌ Error en ping:', error);
            throw error;
        }
    }
};

// ============================================
// INICIALIZACIÓN GLOBAL - VERSIÓN MEJORADA
// ============================================

// NO hacer verificación automática en DOMContentLoaded para evitar loops
// Cada página debe llamar manualmente a AuthService.checkAuth() si lo necesita

// Manejar expiración del token
let expiryCheckInterval = null;

function startExpiryCheck() {
    // Limpiar intervalo anterior si existe
    if (expiryCheckInterval) {
        clearInterval(expiryCheckInterval);
    }

    expiryCheckInterval = setInterval(() => {
        if (AuthService.isAuthenticated()) {
            const userInfo = AuthService.getUserInfo();
            if (userInfo) {
                const timeUntilExpiry = (userInfo.exp * 1000) - Date.now();

                // Si quedan menos de 5 minutos, avisar
                if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
                    console.warn('⚠️ Tu sesión expirará pronto');
                }

                // Si ya expiró, cerrar sesión
                if (timeUntilExpiry <= 0) {
                    console.error('❌ Sesión expirada');
                    AuthService.logout();
                }
            }
        }
    }, 60000); // Verificar cada minuto
}

// Iniciar verificación de expiración cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    startExpiryCheck();
});

// Exponer globalmente
window.AuthService = AuthService;
window.API_BASE_URL = API_BASE_URL;