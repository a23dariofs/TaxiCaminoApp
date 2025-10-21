package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.Presupuesto;
import com.example.TaxiWaySarria.Service.PresupuestoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    public PresupuestoController(PresupuestoService presupuestoService) {
        this.presupuestoService = presupuestoService;
    }

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

    @GetMapping("/aceptar")
    public ResponseEntity<String> aceptarPresupuesto(@RequestParam String token) {
        boolean aceptado = presupuestoService.aceptarPresupuesto(token);
        if (aceptado) {
            return ResponseEntity.ok("Presupuesto aceptado correctamente ");
        } else {
            return ResponseEntity.status(404).body("Token inválido ");
        }
    }
}
