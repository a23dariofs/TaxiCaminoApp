# 🚕 TaxiWay Sarria - Integración Frontend-Backend

## 📁 Estructura de Archivos

```
tu-proyecto/
├── frontend/
│   ├── inicio.html          # HTML principal (tu archivo existente)
│   ├── css/
│   │   └── inicio.css       # Estilos personalizados
│   └── js/
│       └── inicio.js        # Lógica de conexión con el backend
└── backend/
    └── src/main/java/com/example/TaxiWaySarria/
        └── Config/
            └── CorsConfig.java   # Configuración CORS
```

## 🚀 Instalación y Configuración

### 1️⃣ Configurar el Backend (Spring Boot)

#### Paso 1: Agregar la configuración CORS
Copia el archivo `CorsConfig.java` en tu proyecto Spring Boot:
```
src/main/java/com/example/TaxiWaySarria/Config/CorsConfig.java
```

#### Paso 2: Verificar que tu aplicación esté corriendo
```bash
# Ejecutar Spring Boot
./mvnw spring-boot:run

# O si usas Maven
mvn spring-boot:run

# O si usas Gradle
./gradlew bootRun
```

Tu backend debería estar disponible en: `http://localhost:8080`

#### Paso 3: Verificar los endpoints
Abre tu navegador y prueba:
- `http://localhost:8080/api/rutas/hoy` - Debería devolver las rutas de hoy
- `http://localhost:8080/api/repartidores` - Debería devolver los repartidores

### 2️⃣ Configurar el Frontend

#### Paso 1: Organizar los archivos
Coloca los archivos en sus respectivas carpetas:
- `inicio.html` → raíz o carpeta frontend
- `inicio.css` → carpeta `/css/`
- `inicio.js` → carpeta `/js/`

#### Paso 2: Verificar las rutas en tu HTML
Asegúrate de que tu `inicio.html` tenga estas líneas:
```html


```

#### Paso 3: Configurar la URL del API
Si tu backend NO está en el puerto 8080, edita la línea 5 de `inicio.js`:
```javascript
const API_BASE_URL = 'http://localhost:TU_PUERTO/api';
```

### 3️⃣ Ejecutar el Frontend

Tienes varias opciones:

#### Opción A: Live Server (VS Code) - **RECOMENDADO**
1. Instala la extensión "Live Server" en VS Code
2. Click derecho en `inicio.html`
3. Selecciona "Open with Live Server"
4. Se abrirá automáticamente en `http://localhost:5500`

#### Opción B: Python HTTP Server
```bash
# En la carpeta del proyecto
python -m http.server 8000

# Abre en el navegador:
# http://localhost:8000/inicio.html
```

#### Opción C: Node.js HTTP Server
```bash
# Instalar http-server globalmente
npm install -g http-server

# Ejecutar en la carpeta del proyecto
http-server -p 8000

# Abre en el navegador:
# http://localhost:8000/inicio.html
```

## 📊 Funcionalidades Implementadas

### ✅ Lo que ya funciona:
1. **Carga de rutas de hoy**: Al abrir la página, se cargan automáticamente las rutas del día
2. **Visualización de rutas**: Muestra todas las rutas en la tabla con su información
3. **Estadísticas**: Actualiza automáticamente el número de rutas totales, completadas y pendientes
4. **Actualización de fecha**: Muestra la fecha actual en el header
5. **Botones de acción**: Editar y Duplicar rutas (funcionalidad básica)
6. **Notificaciones**: Sistema de notificaciones para éxito y errores
7. **Estados visuales**: Loading, errores y tabla vacía

### 🔨 Próximas funcionalidades a implementar:
1. **Modal para crear ruta**: Crear nuevas rutas desde la interfaz
2. **Edición completa**: Formulario de edición de rutas
3. **Filtros avanzados**: Filtrar por fecha, repartidor, estado
4. **Asignación de repartidores**: Asignar/cambiar repartidores desde la UI
5. **Detalles de ruta**: Ver y editar los detalles (paradas) de cada ruta
6. **Paginación funcional**: Navegación entre páginas de resultados

## 🔧 Personalización

### Cambiar el puerto del backend
En `inicio.js`, línea 5:
```javascript
const API_BASE_URL = 'http://localhost:8080/api'; // Cambia 8080 por tu puerto
```

### Modificar colores del tema
En `inicio.css`, líneas 5-9:
```css
:root {
    --primary: #1773cf;        /* Color principal */
    --primary-dark: #125aa8;   /* Color principal oscuro */
    --primary-light: #e0f2fe;  /* Color principal claro */
}
```

### Adaptar el modelo de datos
Si tu modelo de `RutaDiaria` tiene campos diferentes, modifica la función `renderizarRutas()` en `inicio.js` (línea 207):
```javascript
// Ejemplo: si tu campo se llama "horaInicio" en lugar de "fecha"
const hora = extraerHora(ruta.horaInicio);

// Ejemplo: si tu campo se llama "puntoInicio" en lugar de "origen"
const origen = ruta.puntoInicio || 'Origen no especificado';
```

## 🐛 Solución de Problemas

### Problema: "Failed to fetch" o error CORS

**Solución 1**: Verifica que el backend esté corriendo
```bash
# Comprueba que Spring Boot esté activo
curl http://localhost:8080/api/rutas/hoy
```

**Solución 2**: Verifica que hayas agregado `CorsConfig.java`
- El archivo debe estar en `src/main/java/com/example/TaxiWaySarria/Config/`
- Reinicia tu aplicación Spring Boot después de agregarlo

**Solución 3**: Verifica la consola del navegador
- Presiona F12
- Ve a la pestaña "Console"
- Lee el mensaje de error completo

### Problema: "La tabla está vacía"

**Causa posible**: No hay datos en la base de datos

**Solución**: Agrega datos de prueba
```sql
-- Ejemplo de inserción en la base de datos
INSERT INTO ruta_diaria (fecha, nombre, descripcion) 
VALUES (CURRENT_DATE, 'Ruta Norte', 'Ruta de prueba');
```

### Problema: "Los datos no se muestran correctamente"

**Causa posible**: Tu modelo de datos es diferente

**Solución**: Abre la consola del navegador (F12) y verifica el formato de los datos:
```javascript
// Los datos deberían verse así:
console.log(rutas);
// [{id: 1, fecha: "2026-01-27", nombre: "Ruta 1", ...}, ...]
```

Si tus campos son diferentes, adapta el código en `renderizarRutas()`.

### Problema: "Las notificaciones no aparecen"

**Solución**: Asegúrate de que `inicio.css` esté cargado correctamente
- Verifica la ruta en el HTML: `<link rel="stylesheet" href="/css/inicio.css">`
- Comprueba que el archivo exista en la carpeta `/css/`

## 📝 Estructura del Modelo de Datos

El código espera que tu modelo `RutaDiaria` tenga al menos estos campos:

```java
public class RutaDiaria {
    private Long id;
    private LocalDate fecha;
    private String nombre;
    private String descripcion;
    private Repartidor repartidor;
    
    // Campos opcionales que el frontend puede usar:
    private String origen;
    private String destino;
    private String cliente;
    private Double precio;
    private String estado; // "PENDIENTE", "EN_CURSO", "COMPLETADA", "CANCELADA"
    private Boolean completada;
    private Boolean cancelada;
    private Boolean enCurso;
    
    // getters y setters...
}
```

## 🎯 Ejemplos de Uso

### Cargar rutas manualmente
```javascript
// En la consola del navegador (F12)
await cargarRutasDeHoy();
```

### Crear una ruta desde la consola
```javascript
const nuevaRuta = {
    fecha: "2026-01-27T10:00:00",
    nombre: "Ruta de prueba",
    descripcion: "Esta es una ruta de prueba",
    origen: "Aeropuerto",
    destino: "Centro",
    precio: 25.50
};

await RutaDiariaService.crear(nuevaRuta);
await cargarRutasDeHoy(); // Recargar la tabla
```

### Asignar repartidor a una ruta
```javascript
// rutaId = 1, repartidorId = 5
await RutaDiariaService.asignarRepartidor(1, 5);
await cargarRutasDeHoy(); // Recargar la tabla
```

## 📞 Soporte y Ayuda

Si tienes problemas:

1. **Verifica la consola del navegador** (F12 → Console)
2. **Verifica los logs de Spring Boot** en tu terminal
3. **Comprueba que los endpoints funcionen** con Postman o curl
4. **Revisa que CORS esté configurado** correctamente

### Endpoints disponibles:
- `GET /api/rutas` - Listar todas las rutas
- `GET /api/rutas/hoy` - Rutas de hoy
- `GET /api/rutas/{id}` - Buscar por ID
- `POST /api/rutas` - Crear ruta
- `PUT /api/rutas/{id}` - Actualizar ruta
- `DELETE /api/rutas/{id}` - Eliminar ruta
- `POST /api/rutas/{rutaId}/asignar-repartidor/{repartidorId}` - Asignar repartidor
- `GET /api/rutas/fecha/{fecha}` - Buscar por fecha
- `GET /api/rutas/repartidor/{repartidorId}` - Buscar por repartidor

## 🔐 Notas de Seguridad

⚠️ **IMPORTANTE**: La configuración actual de CORS permite peticiones desde cualquier origen (`*`).

Para **producción**, cambia esto en `CorsConfig.java`:
```java
.allowedOrigins(
    "https://tu-dominio.com",  // Solo tu dominio
    "https://www.tu-dominio.com"
)
.allowCredentials(true)  // Si usas autenticación
```

## 📚 Recursos Adicionales

- [Spring Boot CORS Documentation](https://spring.io/guides/gs/rest-service-cors/)
- [Fetch API Documentation](https://developer.mozilla.org/es/docs/Web/API/Fetch_API)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Versión**: 1.0  
**Fecha**: Enero 2026  
**Autor**: Integración Frontend-Backend TaxiWay Sarria