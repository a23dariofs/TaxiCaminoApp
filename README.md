🚀 IMPLEMENTACIÓN COMPLETA: Flujo de Pago Anticipado
📋 RESUMEN DEL FLUJO
1. CREAR PRESUPUESTO → 2. ENVIAR EMAIL → 3. CLIENTE ACEPTA →
4. AUTO-CREAR RESERVA + FACTURA → 5. CLIENTE PAGA →
6. ASIGNAR REPARTIDOR → 7. AUTO-CREAR RUTA DIARIA

🔧 CAMBIOS EN EL BACKEND
1. Actualizar PresupuestoService.java
   Reemplaza tu PresupuestoService completo con el archivo /tmp/presupuesto_service_updated.java
   Cambios clave:

Añadido ReservaRepository y FacturaRepository como dependencias
Método aceptarPresupuesto() ahora:

✅ Crea automáticamente una Reserva con estado "Confirmada"
✅ Crea automáticamente una Factura con estado "PENDIENTE"
✅ El concepto de la factura incluye origen, destino y fecha



2. Actualizar PresupuestoController.java
   Reemplaza tu PresupuestoController completo con el archivo /tmp/presupuesto_controller_updated.java
   Cambios clave:

El endpoint /api/presupuestos/aceptar?token=... ahora redirige a /pago.html?mensaje=presupuesto_aceptado
Muestra mensaje de éxito al usuario
Si hay error, redirige con ?error=...

3. Actualizar modelo Reserva.java
   Añade el campo observaciones si no lo tienes:
   java@Entity
   @Table(name = "reservas")
   public class Reserva {
   // ... campos existentes ...

   private String observaciones;  // ← AÑADIR

   // getter y setter
   public String getObservaciones() {
   return observaciones;
   }

   public void setObservaciones(String observaciones) {
   this.observaciones = observaciones;
   }
   }

🎨 CAMBIOS EN EL FRONTEND
Archivo actualizado: pago.js
✅ Ya entregado en /mnt/user-data/outputs/pago.js
Nuevas funcionalidades:

Detecta cuando el usuario viene desde el link del email
Muestra mensaje: "¡Presupuesto aceptado! Se ha creado una reserva y una factura pendiente de pago."
La nueva factura aparecerá en la lista como PENDIENTE


📝 SIGUIENTE PASO: Asignar Repartidor y Crear Ruta
Actualizar ReservaService.java
Añade este método o actualízalo si ya existe:
javapublic Reserva asignarRepartidor(Long reservaId, Long repartidorId) {
Reserva reserva = buscarPorId(reservaId);

    // Verificar que la factura esté PAGADA antes de asignar repartidor
    Factura factura = facturaRepository.findByClienteIdAndConceptoContaining(
        reserva.getCliente().getId(), 
        reserva.getOrigen()
    );
    
    if (factura == null || !"PAGADO".equals(factura.getEstado())) {
        throw new RuntimeException("No se puede asignar repartidor: El pago está pendiente");
    }
    
    Repartidor repartidor = repartidorRepository.findById(repartidorId)
        .orElseThrow(() -> new RuntimeException("Repartidor no encontrado"));
    
    reserva.setRepartidor(repartidor);
    reserva.setEstado("Asignada");
    reservaRepository.save(reserva);
    
    // CREAR RUTA DIARIA AUTOMÁTICAMENTE
    RutaDiaria ruta = new RutaDiaria();
    ruta.setFecha(reserva.getFecha());
    ruta.setOrigen(reserva.getOrigen());
    ruta.setDestino(reserva.getDestino());
    ruta.setCliente(reserva.getCliente().getNombre());
    ruta.setRepartidor(repartidor);
    ruta.setPrecio(reserva.getPrecio());
    ruta.setEstado(EstadoRuta.PENDIENTE);
    rutaDiariaRepository.save(ruta);
    
    return reserva;
}

✅ TESTING DEL FLUJO COMPLETO
Paso 1: Crear y Enviar Presupuesto

Ve a presupuesto.html
Crea un presupuesto para un cliente
Haz clic en "Enviar presupuesto"
El cliente recibirá un email

Paso 2: Cliente Acepta Presupuesto

Cliente abre el email
Hace clic en "Aceptar Presupuesto y Proceder al Pago"
Automático: Se crea Reserva + Factura PENDIENTE
Redirige a /pago.html con mensaje de éxito

Paso 3: Ver Factura Pendiente

En pago.html aparecerá la nueva factura con estado PENDIENTE (naranja)
Tiene botones: "Marcar pagada", "Editar", "Eliminar"

Paso 4: Marcar como Pagada

Haz clic en "Marcar pagada"
Automático:

Factura → Estado PAGADO
Fecha de pago = hoy



Paso 5: Asignar Repartidor

Ve a reservas.html
Busca la reserva recién creada (estado "Confirmada")
Asigna un repartidor
Automático: Se crea una RutaDiaria para ese repartidor

Paso 6: Ver Ruta Diaria

Ve a inicio.html (Ruta Diaria)
La ruta aparecerá automáticamente para el repartidor asignado
Estado: PENDIENTE


🚨 IMPORTANTE: Validaciones
Regla 1: No asignar repartidor sin pago
Si intentas asignar repartidor a una reserva cuya factura no está PAGADA:
❌ Error: "No se puede asignar repartidor: El pago está pendiente"
Regla 2: No crear ruta sin repartidor
Solo se crea ruta diaria cuando se asigna un repartidor
Regla 3: Estado de presupuesto
Un presupuesto solo puede aceptarse una vez:
Estados: Borrador → Enviado → Aceptado

📊 ESTADOS DE CADA ENTIDAD
Presupuesto

Borrador - Recién creado
Enviado - Email enviado al cliente
Aceptado - Cliente aceptó (ya no se puede volver a aceptar)

Reserva

Confirmada - Creada desde presupuesto aceptado
Asignada - Repartidor asignado
Completada - Servicio completado

Factura

PENDIENTE - Cliente aún no ha pagado
PAGADO - Cliente ya pagó
FALLIDO - Pago rechazado

RutaDiaria

PENDIENTE - Por realizar
EN_CURSO - En progreso
COMPLETADA - Finalizada
CANCELADA - Cancelada


🔄 DIAGRAMA DE FLUJO COMPLETO
┌─────────────────┐
│  CREAR CLIENTE  │
└────────┬────────┘
│
↓
┌─────────────────────┐
│ CREAR PRESUPUESTO   │
│ Estado: Borrador    │
└────────┬────────────┘
│
↓ Click "Enviar"
┌─────────────────────┐
│ ENVIAR EMAIL        │
│ Estado: Enviado     │
└────────┬────────────┘
│
↓ Cliente click link
┌─────────────────────┐
│ ACEPTAR PRESUPUESTO │
│ Estado: Aceptado    │
└────────┬────────────┘
│
├──► CREAR RESERVA (Confirmada)
└──► CREAR FACTURA (PENDIENTE)
│
↓ Ver en pago.html
┌─────────────────────┐
│ FACTURA PENDIENTE   │
│ Estado: PENDIENTE   │
└────────┬────────────┘
│
↓ Click "Marcar pagada"
┌─────────────────────┐
│ FACTURA PAGADA      │
│ Estado: PAGADO      │
└────────┬────────────┘
│
↓ Ver en reservas.html
┌─────────────────────┐
│ ASIGNAR REPARTIDOR  │
│ Estado: Asignada    │
└────────┬────────────┘
│
├──► CREAR RUTA DIARIA (PENDIENTE)
│
↓ Ver en inicio.html
┌─────────────────────┐
│ RUTA DIARIA         │
│ Estado: PENDIENTE   │
└────────┬────────────┘
│
↓ Completar ruta
┌─────────────────────┐
│ RUTA COMPLETADA     │
│ Estado: COMPLETADA  │
└─────────────────────┘

✨ FUNCIONALIDADES BONUS
1. Historial de Cliente
   En clientes.html, añadir botón "Ver historial" que muestre:

Todos los presupuestos del cliente
Todas las reservas del cliente
Todas las facturas del cliente

2. Dashboard Mejorado
   Crear pantalla inicial con:
   📊 RESUMEN DEL DÍA
   ├─ Presupuestos enviados hoy: 5
   ├─ Presupuestos aceptados hoy: 2
   ├─ Reservas confirmadas: 8
   ├─ Rutas completadas: 3
   ├─ Facturas pagadas hoy: 2
   └─ Ingresos del día: €450.00
3. Notificaciones

Email al repartidor cuando se le asigna una ruta
Email al cliente cuando paga (recibo)
Email al admin cuando se acepta un presupuesto



COUSAS QUE CAMBIAR:


Crear ben as reservas como en taxicamino, meter a ruta completa porque non é solo un destino e un origen. ✅
Pestaña de agencias, que salgan as reservas de cada agencia nunha fecha determinada, para poder facturar. 
Gestión da ruta (añadir pestaña que sea solo cas mochilas, para diferencialo dos viaxes do taxi)
Excels.

- Pestaña para crear agencias e asi non metelas todas desde a base de datos. ✅  
- Cambiar o da pestaña de cliente para que salga todo directamente ao crear a reserva (nombre, telefono, etc...) ✅
- Facturar en principio quitase ✅
- En estado poñer pagado en ruta ou pagado por transferencia, bizum para levar control de como se foi pagando a reserva e asi. ✅
   - Na tabla de ruta diaria cambiar os campos en este orden:  Origen, Cliente, Numero de equipajes, precio, destino, agencia, empresa observacions ( para comentar algo)✅
- A empresa e quen manda o servicio.

Crear un boton en la reserva que sea crear una etiqueta. ✅
Para tema facturas -> Buscar por agencia ou empresa -> numero de reservas de cada empresa/agencia -> un intervalo de fechas para facer buscar os servicios que se fixeron en ese tempo e poder generar a factura.✅
A factura -> en excel mellor seguindo o modelo
facturas de viaxe ao 10% no de mochilas ao 21% vai incluido.

En ruta diaria facer unha para viaxes de taxi e outra para mochilas.

taxicaminolugo@gmail.com e +34689440529 (esto para añadir nas etiquetas e quitar o correo que ta posto xa e o qr)

o mais importante nas facturas e que saque durante un intervalo de tempo os cartos a pagar de cada empresa ou a agencia

meter nombre e que se garde para outras veces na base de datos.

no tema dos taxis pode ser que se transpase o servicio a outro

buscar por conductor para ver os viaxes que se lle dan (ver si esta pagado ou no)