## Relaciones principales

Cliente ↔ Presupuesto (1:N).

Presupuesto ↔ PresupuestoDetalle ↔ Albergue (1:N, N:1).

Presupuesto ↔ Reserva (1:1).

Reserva ↔ Repartidor (N:M).

Repartidor ↔ RutaDiaria (1:N).

RutaDiaria ↔ RutaDetalle ↔ Albergue (1:N, N:1).

Cliente ↔ Factura (1:N).

Factura ↔ LineaFactura (1:N).


## Arquitectura general (visión global)

### AuthController (login y register)

register → es como dar de alta a un usuario en tu sistema.

Guardas el nombre, el rol y cifras la contraseña para que nadie pueda leerla en la base de datos.

Ejemplo: si alguien mira la BD, verá algo como "$2a$10$abc123..." en vez de "12345".

login → es como “abrir la puerta con llave”.

Spring usa AuthenticationManager.authenticate(...) para comprobar si usuario + contraseña son correctos.

Si son correctos → generas un token JWT. Ese token es como un pase que dice: “yo soy X y tengo permiso Y”.

Si son incorrectos → te tira error y no pasa nadie.

###  UsuarioDetailsServiceImpl

Es quien dice a Spring cómo encontrar a un usuario en tu base de datos.

Devuelve un objeto UserDetails que tiene:

Nombre de usuario

Contraseña cifrada

Roles (permisos) → por ejemplo "ROLE_ADMIN" o "ROLE_REPARTIDOR"

Piensa que es como la tarjeta de identidad del usuario que Spring usa para verificar permisos.

### JwtUtil (el generador de pases)

generateToken(username, role) → crea un pase (token) con:

Quién es (username)

Qué puede hacer (role)

Fecha de creación y expiración

Firma digital para que nadie pueda falsificarlo

validateToken(token) → comprueba si el pase es válido y no está caducado.

getUsernameFromToken / getRoleFromToken → extrae la info del pase.

💡 Analogía: JWT = pase de metro digital con tu nombre y privilegios escritos y sellado por seguridad.

### JwtFilter (el guardia en la puerta)

Antes de dejar entrar cualquier petición a tu API:

Mira si viene un token en el header Authorization.

Comprueba que el token es válido (jwtUtil.validateToken).

Si todo bien → dice a Spring: “este usuario es X y tiene permisos Y”.

Luego deja pasar la petición al controlador correspondiente.

💡 Analogía: es como un guardia que mira tu pase antes de dejarte entrar al edificio.

### SecurityConfig (reglas de seguridad)

csrf disabled → APIs sin sesión normalmente no necesitan protección CSRF.

/api/auth/ → acceso libre (para login y register)

cualquier otra ruta → requiere token válido

sessionManagement(STATELESS) → el servidor no guarda sesiones, todo se valida con el token en cada petición

Añade JwtFilter → para que el guardia revise el token antes de todo

Declara PasswordEncoder → para cifrar y comparar contraseñas

Declara AuthenticationManager → el “juez” que decide si la contraseña es correc