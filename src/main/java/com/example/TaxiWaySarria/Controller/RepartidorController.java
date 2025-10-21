package com.example.TaxiWaySarria.Controller;


import com.example.TaxiWaySarria.Model.Repartidor;
import com.example.TaxiWaySarria.Service.RepartidorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repartidores")
public class RepartidorController {

    private final RepartidorService repartidorService;

    public RepartidorController(RepartidorService repartidorService) {
        this.repartidorService = repartidorService;
    }


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


    @PostMapping("/{repartidorId}/reservas/{reservaId}")
    public Repartidor asignarReserva(@PathVariable Long repartidorId, @PathVariable Long reservaId) {
        return repartidorService.asignarReserva(repartidorId, reservaId);
    }

    @DeleteMapping("/{repartidorId}/reservas/{reservaId}")
    public Repartidor quitarReserva(@PathVariable Long repartidorId, @PathVariable Long reservaId) {
        return repartidorService.quitarReserva(repartidorId, reservaId);
    }


    @PostMapping("/{repartidorId}/rutas/{rutaId}")
    public Repartidor asignarRuta(@PathVariable Long repartidorId, @PathVariable Long rutaId) {
        return repartidorService.asignarRuta(repartidorId, rutaId);
    }

    @DeleteMapping("/{repartidorId}/rutas/{rutaId}")
    public Repartidor quitarRuta(@PathVariable Long repartidorId, @PathVariable Long rutaId) {
        return repartidorService.quitarRuta(repartidorId, rutaId);
    }
}