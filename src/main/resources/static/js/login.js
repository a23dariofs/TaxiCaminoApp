// Configuración Tailwind
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#2563eb",
                "background-light": "#f8f8f5",
                "background-dark": "#1a1a1a",
                "text-main": "#1a1a1a",
                "text-muted": "#6b7280",
            },
            fontFamily: {
                display: ["Inter", "sans-serif"]
            },
        },
    },
};

// Esperar a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si ya está autenticado
    if (AuthService.isAuthenticated()) {
        console.log('Ya está autenticado, redirigiendo...');
        window.location.href = "clientes.html"; // o tu página principal
        return;
    }

    // Toggle mostrar/ocultar contraseña
    const passwordInput = document.getElementById("passwordInput");
    const togglePassword = document.getElementById("togglePassword");

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";

            // Cambiar el icono
            const icon = togglePassword.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = isPassword ? "visibility_off" : "visibility";
            }
        });
    }

    // Login con AuthService
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("passwordInput").value.trim();
            const errorMsg = document.getElementById("errorMsg");
            const submitButton = loginForm.querySelector('button[type="submit"]');

            // Limpiar mensaje previo
            errorMsg.textContent = "";
            errorMsg.classList.remove('show-error');

            // Validar campos
            if (!username || !password) {
                mostrarError(errorMsg, "Introduce usuario y contraseña.");
                return;
            }

            // Deshabilitar botón durante el login
            const textoOriginal = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            `;

            try {
                // Usar AuthService para login
                const remember = true; // Siempre recordar sesión (puedes agregar un checkbox)
                await AuthService.login(username, password, remember);

                // Login exitoso
                console.log('✅ Login exitoso');

                // Mostrar mensaje de éxito (opcional)
                submitButton.innerHTML = '<span class="material-symbols-outlined">check_circle</span> ¡Éxito!';
                submitButton.style.backgroundColor = '#10b981'; // Verde

                // Redirigir después de 1 segundo
                setTimeout(() => {
                    window.location.href = "clientes.html"; // o tu página principal
                }, 1000);

            } catch (error) {
                console.error("❌ Error en login:", error);

                // Mostrar error al usuario
                let mensajeError = "Error desconocido. Intenta de nuevo.";

                if (error.message.includes("Usuario o contraseña incorrectos")) {
                    mensajeError = "Usuario o contraseña incorrectos.";
                } else if (error.message.includes("Error al iniciar sesión")) {
                    mensajeError = "Error al iniciar sesión. Verifica tus datos.";
                } else if (error.message.includes("fetch")) {
                    mensajeError = "No se pudo conectar con el servidor. Verifica tu conexión.";
                } else {
                    mensajeError = error.message;
                }

                mostrarError(errorMsg, mensajeError);

                // Rehabilitar botón
                submitButton.disabled = false;
                submitButton.innerHTML = textoOriginal;

                // Sacudir el formulario para indicar error
                loginForm.classList.add('shake');
                setTimeout(() => loginForm.classList.remove('shake'), 500);
            }
        });
    }
});

/**
 * Mostrar mensaje de error con animación
 */
function mostrarError(errorElement, mensaje) {
    if (!errorElement) return;

    errorElement.textContent = mensaje;
    errorElement.classList.add('show-error');

    // Animar el mensaje
    errorElement.style.animation = 'slideDown 0.3s ease-out';
}

// Agregar estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    .shake {
        animation: shake 0.5s;
    }

    .show-error {
        display: block;
        margin-top: 0.5rem;
        padding: 0.75rem;
        background-color: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 0.5rem;
        color: #dc2626;
        font-size: 0.875rem;
        font-weight: 500;
    }

    /* Animación del spinner */
    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .animate-spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);