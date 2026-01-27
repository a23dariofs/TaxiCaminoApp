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
    // Toggle mostrar/ocultar contraseña
    const passwordInput = document.getElementById("passwordInput");
    const togglePassword = document.getElementById("togglePassword");

    togglePassword.addEventListener("click", () => {
        passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    });

    // Login con fetch
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("passwordInput").value.trim();
            const errorMsg = document.getElementById("errorMsg");

            errorMsg.textContent = ""; // Limpiar mensaje previo

            if (!username || !password) {
                errorMsg.textContent = "Introduce usuario y contraseña.";
                return;
            }

            try {
                const response = await fetch("http://localhost:8080/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.json();

                    if (!data.token) {
                        errorMsg.textContent = "Error: No se recibió token del servidor.";
                        return;
                    }

                    localStorage.setItem("token", data.token); // Guardar JWT
                    console.log("Token recibido:", data.token);
                    window.location.href = "inicio.html"; // Redirigir
                } else if (response.status === 401) {
                    errorMsg.textContent = "Usuario o contraseña incorrectos.";
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    errorMsg.textContent = errorData.message || "Error desconocido en el login.";
                }
            } catch (error) {
                console.error("Error al conectar con el backend:", error);
                errorMsg.textContent = "No se pudo conectar con el servidor.";
            }
        });
    }
});
