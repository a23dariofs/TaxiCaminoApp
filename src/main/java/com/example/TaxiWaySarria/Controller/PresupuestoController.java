package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.Presupuesto;
import com.example.TaxiWaySarria.Service.PresupuestoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
@CrossOrigin(origins = "*") // Permitir CORS para desarrollo
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    public PresupuestoController(PresupuestoService presupuestoService) {
        this.presupuestoService = presupuestoService;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENDPOINTS CRUD BÁSICOS (mantener como estaban)
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping
    public List<Presupuesto> getAll() {
        return presupuestoService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Presupuesto> getById(@PathVariable Long id) {
        return presupuestoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Presupuesto create(@RequestBody Presupuesto presupuesto) {
        return presupuestoService.save(presupuesto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Presupuesto> update(@PathVariable Long id, @RequestBody Presupuesto presupuesto) {
        return presupuestoService.findById(id)
                .map(existing -> {
                    presupuesto.setId(id);
                    return ResponseEntity.ok(presupuestoService.save(presupuesto));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (presupuestoService.findById(id).isPresent()) {
            presupuestoService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✨ ENDPOINT ACTUALIZADO: Aceptar presupuesto y REDIRIGIR al frontend
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Endpoint público para que el cliente acepte el presupuesto desde el email.
     *
     * Al aceptar:
     * 1. Actualiza estado del presupuesto a "Aceptado"
     * 2. Crea automáticamente una Reserva
     * 3. Crea automáticamente una Factura en estado PENDIENTE
     * 4. Crea líneas de factura detalladas (una por cada albergue si existen)
     * 5. Redirige al frontend (pago.html) con mensaje de éxito
     *
     * El cliente deberá pagar antes de que se pueda asignar repartidor.
     */
    @GetMapping("/aceptar")
    public RedirectView aceptarPresupuesto(@RequestParam String token) {
        try {
            System.out.println("📩 Recibida solicitud de aceptación con token: " + token);

            boolean aceptado = presupuestoService.aceptarPresupuesto(token);

            if (aceptado) {
                System.out.println("✅ Presupuesto aceptado correctamente");
                // Redirigir al frontend con mensaje de éxito
                return new RedirectView("/pago.html?mensaje=presupuesto_aceptado");
            } else {
                System.out.println("❌ Token inválido o presupuesto no encontrado");
                // Token inválido
                return new RedirectView("/pago.html?error=token_invalido");
            }

        } catch (RuntimeException e) {
            System.err.println("❌ Error al aceptar presupuesto: " + e.getMessage());

            // Error específico (ej: ya fue aceptado)
            String errorMessage = e.getMessage();
            if (errorMessage.contains("ya ha sido aceptado")) {
                return new RedirectView("/pago.html?error=ya_aceptado");
            }

            return new RedirectView("/pago.html?error=error_procesamiento");

        } catch (Exception e) {
            System.err.println("❌ Error inesperado: " + e.getMessage());
            e.printStackTrace();
            return new RedirectView("/pago.html?error=error_servidor");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📧 ENDPOINT PARA ENVIAR PRESUPUESTO POR EMAIL
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{id}/enviar")
    public ResponseEntity<String> enviarPresupuesto(@PathVariable Long id) {
        try {
            presupuestoService.enviarPorEmail(id);
            return ResponseEntity.ok("✅ Presupuesto enviado correctamente por email");
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body("❌ Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("❌ Error al enviar: " + e.getMessage());
        }
    }
}