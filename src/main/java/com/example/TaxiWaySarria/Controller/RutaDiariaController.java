package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.RutaDiaria;
import com.example.TaxiWaySarria.Service.RutaDiariaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rutas-diarias")
@CrossOrigin(origins = "*")
public class RutaDiariaController {

    private final RutaDiariaService rutaDiariaService;

    public RutaDiariaController(RutaDiariaService rutaDiariaService) {
        this.rutaDiariaService = rutaDiariaService;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENDPOINTS CRUD BÁSICOS
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping
    public List<RutaDiaria> listarTodas() {
        return rutaDiariaService.listarTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RutaDiaria> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(rutaDiariaService.buscarPorId(id));
    }

    @PostMapping
    public RutaDiaria crear(@RequestBody RutaDiaria rutaDiaria) {
        return rutaDiariaService.crear(rutaDiaria);
    }

    @PutMapping("/{id}")
    public RutaDiaria actualizar(@PathVariable Long id, @RequestBody RutaDiaria rutaDiaria) {
        return rutaDiariaService.actualizar(id, rutaDiaria);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminar(@PathVariable Long id) {
        rutaDiariaService.eliminar(id);
        return ResponseEntity.ok("Ruta diaria eliminada correctamente");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ ENDPOINT NUEVO: Buscar rutas por fecha
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Busca todas las rutas de una fecha específica
     *
     * @param fecha Fecha en formato YYYY-MM-DD (ejemplo: 2024-08-15)
     * @return Lista de rutas de esa fecha con sus detalles
     */
    @GetMapping("/fecha/{fecha}")
    public ResponseEntity<List<RutaDiaria>> buscarPorFecha(@PathVariable String fecha) {
        try {
            LocalDate fechaBusqueda = LocalDate.parse(fecha);
            List<RutaDiaria> rutas = rutaDiariaService.buscarPorFecha(fechaBusqueda);

            System.out.println("Buscando rutas para fecha: " + fecha);
            System.out.println("Encontradas " + rutas.size() + " rutas");

            return ResponseEntity.ok(rutas);

        } catch (Exception e) {
            System.err.println("Error al buscar rutas por fecha: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ ENDPOINT NUEVO: Cambiar estado de una ruta
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Cambia el estado de una ruta diaria
     *
     * @param id ID de la ruta
     * @param body JSON con el nuevo estado: {"estado": "EN_CURSO"} o {"estado": "COMPLETADA"}
     * @return Ruta actualizada
     */
    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String nuevoEstado = body.get("estado");

            if (nuevoEstado == null || nuevoEstado.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("El estado es obligatorio");
            }

            // Validar estados permitidos
            if (!nuevoEstado.equals("PENDIENTE") &&
                    !nuevoEstado.equals("EN_CURSO") &&
                    !nuevoEstado.equals("COMPLETADA")) {
                return ResponseEntity.badRequest().body("Estado no válido. Debe ser: PENDIENTE, EN_CURSO o COMPLETADA");
            }

            RutaDiaria ruta = rutaDiariaService.cambiarEstado(id, nuevoEstado);

            System.out.println("Estado de ruta " + id + " cambiado a: " + nuevoEstado);

            return ResponseEntity.ok(ruta);

        } catch (RuntimeException e) {
            System.err.println("Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("Error al cambiar estado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error interno del servidor");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENDPOINTS ADICIONALES (si existen en tu RutaDiariaService)
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping("/repartidor/{repartidorId}")
    public List<RutaDiaria> buscarPorRepartidor(@PathVariable Long repartidorId) {
        return rutaDiariaService.buscarPorRepartidor(repartidorId);
    }
}