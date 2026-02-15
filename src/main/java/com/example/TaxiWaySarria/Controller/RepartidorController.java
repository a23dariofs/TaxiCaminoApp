package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.Repartidor;
import com.example.TaxiWaySarria.Model.Reserva;
import com.example.TaxiWaySarria.Service.RepartidorService;
import com.example.TaxiWaySarria.Service.ReservaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repartidores")
@CrossOrigin(origins = "*") // Permitir CORS para desarrollo
public class RepartidorController {

    private final RepartidorService repartidorService;
    private final ReservaService reservaService;

    public RepartidorController(RepartidorService repartidorService, ReservaService reservaService) {
        this.repartidorService = repartidorService;
        this.reservaService = reservaService;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENDPOINTS CRUD BÁSICOS (mantener como estaban)
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping
    public List<Repartidor> listarTodos() {
        return repartidorService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Repartidor> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(repartidorService.buscarPorId(id));
    }

    @PostMapping
    public Repartidor crear(@RequestBody Repartidor repartidor) {
        return repartidorService.crear(repartidor);
    }

    @PutMapping("/{id}")
    public Repartidor actualizar(@PathVariable Long id, @RequestBody Repartidor datos) {
        return repartidorService.actualizar(id, datos);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminar(@PathVariable Long id) {
        repartidorService.eliminar(id);
        return ResponseEntity.ok("Repartidor eliminado correctamente");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✨ ENDPOINT ACTUALIZADO: Asignar reserva CON VALIDACIÓN DE PAGO
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Asigna un repartidor a una reserva SOLO SI el pago está completado.
     *
     * FLUJO:
     * 1. Valida que la factura del cliente esté en estado PAGADO
     * 2. Si NO está pagado → lanza excepción con mensaje claro
     * 3. Si está pagado → asigna repartidor
     * 4. Crea automáticamente RutaDiaria con albergues (si existen en el presupuesto)
     *
     * IMPORTANTE: Este endpoint reemplaza al antiguo asignarReserva()
     * porque ahora incluye validación de pago.
     */
    @PostMapping("/{repartidorId}/reservas/{reservaId}")
    public ResponseEntity<?> asignarReservaConValidacion(@PathVariable Long repartidorId,
                                                         @PathVariable Long reservaId) {
        try {
            System.out.println("📋 Intentando asignar Repartidor " + repartidorId + " a Reserva " + reservaId);

            // Usar el método nuevo que valida el pago y auto-crea la RutaDiaria
            Reserva reserva = reservaService.asignarRepartidorConValidacionPago(reservaId, repartidorId);

            System.out.println("✅ Asignación completada exitosamente");

            // Respuesta exitosa
            return ResponseEntity.ok().body(
                    "✅ Repartidor asignado correctamente. " +
                            "Se ha creado la RutaDiaria automáticamente con las paradas programadas."
            );

        } catch (RuntimeException e) {
            System.err.println("❌ Error en asignación: " + e.getMessage());

            // Si el error es por pago pendiente, devolver 400 Bad Request
            if (e.getMessage().contains("PAGO PENDIENTE") ||
                    e.getMessage().contains("pago") ||
                    e.getMessage().contains("PAGADO")) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }

            // Si es otro tipo de error (reserva no encontrada, etc.)
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * Endpoint alternativo con mejor nombre para claridad.
     * Es un alias del endpoint anterior.
     */
    @PostMapping("/{repartidorId}/reservas/{reservaId}/asignar-con-validacion")
    public ResponseEntity<?> asignarConValidacionPago(@PathVariable Long repartidorId,
                                                      @PathVariable Long reservaId) {
        return asignarReservaConValidacion(repartidorId, reservaId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OTROS ENDPOINTS (mantener si existen en tu RepartidorService)
    // ═══════════════════════════════════════════════════════════════════════════

    @DeleteMapping("/{repartidorId}/reservas/{reservaId}")
    public ResponseEntity<Repartidor> quitarReserva(@PathVariable Long repartidorId, @PathVariable Long reservaId) {
        try {
            Repartidor repartidor = repartidorService.quitarReserva(repartidorId, reservaId);
            return ResponseEntity.ok(repartidor);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{repartidorId}/rutas/{rutaId}")
    public ResponseEntity<Repartidor> asignarRuta(@PathVariable Long repartidorId, @PathVariable Long rutaId) {
        try {
            Repartidor repartidor = repartidorService.asignarRuta(repartidorId, rutaId);
            return ResponseEntity.ok(repartidor);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{repartidorId}/rutas/{rutaId}")
    public ResponseEntity<Repartidor> quitarRuta(@PathVariable Long repartidorId, @PathVariable Long rutaId) {
        try {
            Repartidor repartidor = repartidorService.quitarRuta(repartidorId, rutaId);
            return ResponseEntity.ok(repartidor);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}