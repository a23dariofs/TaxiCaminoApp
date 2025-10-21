package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.RutaDetalle;
import com.example.TaxiWaySarria.Service.RutaDetalleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ruta-detalles")
public class RutaDetalleController {

    private final RutaDetalleService rutaDetalleService;

    public RutaDetalleController(RutaDetalleService rutaDetalleService) {
        this.rutaDetalleService = rutaDetalleService;
    }

    @GetMapping
    public List<RutaDetalle> listarTodos() {
        return rutaDetalleService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RutaDetalle> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(rutaDetalleService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<RutaDetalle> crear(@RequestParam Long rutaId,
                                             @RequestParam Long albergueId,
                                             @RequestParam Integer orden) {
        return ResponseEntity.ok(rutaDetalleService.crear(rutaId, albergueId, orden));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RutaDetalle> actualizar(@PathVariable Long id,
                                                  @RequestParam Integer orden) {
        return ResponseEntity.ok(rutaDetalleService.actualizar(id, orden));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        rutaDetalleService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ruta/{rutaId}")
    public List<RutaDetalle> buscarPorRuta(@PathVariable Long rutaId) {
        return rutaDetalleService.buscarPorRuta(rutaId);
    }
}