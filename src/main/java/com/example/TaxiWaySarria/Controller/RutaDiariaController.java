package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.RutaDiaria;
import com.example.TaxiWaySarria.Service.RutaDiariaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rutas")
public class RutaDiariaController {

    private final RutaDiariaService rutaService;

    public RutaDiariaController(RutaDiariaService rutaService) {
        this.rutaService = rutaService;
    }

    @GetMapping
    public List<RutaDiaria> listarTodas() {
        return rutaService.listarTodas();
    }

    @GetMapping("/{id}")
    public RutaDiaria buscarPorId(@PathVariable Long id) {
        return rutaService.buscarPorId(id);
    }

    @PostMapping
    public RutaDiaria crear(@RequestBody RutaDiaria ruta) {
        return rutaService.crear(ruta);
    }

    @PutMapping("/{id}")
    public RutaDiaria actualizar(@PathVariable Long id, @RequestBody RutaDiaria ruta) {
        return rutaService.actualizar(id, ruta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        rutaService.eliminar(id);
        return ResponseEntity.ok().build();
    }

    // Asignar repartidor a ruta
    @PostMapping("/{rutaId}/asignar-repartidor/{repartidorId}")
    public RutaDiaria asignarRepartidor(@PathVariable Long rutaId, @PathVariable Long repartidorId) {
        return rutaService.asignarRepartidor(rutaId, repartidorId);
    }

    // Consultas
    @GetMapping("/fecha/{fecha}")
    public List<RutaDiaria> buscarPorFecha(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return rutaService.buscarPorFecha(fecha);
    }

    @GetMapping("/repartidor/{repartidorId}")
    public List<RutaDiaria> buscarPorRepartidor(@PathVariable Long repartidorId) {
        return rutaService.buscarPorRepartidor(repartidorId);
    }
}