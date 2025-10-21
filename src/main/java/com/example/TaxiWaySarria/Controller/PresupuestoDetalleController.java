package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.PresupuestoDetalle;
import com.example.TaxiWaySarria.Service.PresupuestoDetalleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/presupuestos-detalles")
public class PresupuestoDetalleController {

    private final PresupuestoDetalleService detalleService;

    public PresupuestoDetalleController(PresupuestoDetalleService detalleService) {
        this.detalleService = detalleService;
    }

    @GetMapping
    public List<PresupuestoDetalle> listarTodos() {
        return detalleService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PresupuestoDetalle> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(detalleService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<PresupuestoDetalle> crear(@RequestParam Long presupuestoId,
                                                    @RequestParam Long albergueId,
                                                    @RequestParam Integer orden) {
        return ResponseEntity.ok(detalleService.crear(presupuestoId, albergueId, orden));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PresupuestoDetalle> actualizar(@PathVariable Long id,
                                                         @RequestParam(required = false) Long albergueId,
                                                         @RequestParam(required = false) Integer orden) {
        return ResponseEntity.ok(detalleService.actualizar(id, albergueId, orden));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        detalleService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/presupuesto/{presupuestoId}")
    public List<PresupuestoDetalle> buscarPorPresupuesto(@PathVariable Long presupuestoId) {
        return detalleService.buscarPorPresupuesto(presupuestoId);
    }
}
