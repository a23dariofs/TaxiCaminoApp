document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  errorMsg.textContent = ""; // Limpiar mensaje previo

  if (!username || !password) {
    errorMsg.textContent = "Introduce usuario y contraseña.";
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      window.location.href = "dashboard.html"; // Redirigir
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