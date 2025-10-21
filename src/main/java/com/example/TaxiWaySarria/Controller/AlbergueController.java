package com.example.TaxiWaySarria.Controller;


import com.example.TaxiWaySarria.Model.Albergue;
import com.example.TaxiWaySarria.Service.AlbergueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/albergues")
public class AlbergueController {

    private final AlbergueService albergueService;

    public AlbergueController(AlbergueService albergueService) {
        this.albergueService = albergueService;
    }

    @GetMapping
    public List<Albergue> listarTodos() {
        return albergueService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Albergue> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(albergueService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Albergue> crear(@RequestBody Albergue albergue) {
        return ResponseEntity.ok(albergueService.crear(albergue));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Albergue> actualizar(@PathVariable Long id, @RequestBody Albergue albergue) {
        return ResponseEntity.ok(albergueService.actualizar(id, albergue));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        albergueService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ciudad/{ciudad}")
    public List<Albergue> buscarPorCiudad(@PathVariable String ciudad) {
        return albergueService.buscarPorCiudad(ciudad);
    }

    @GetMapping("/provincia/{provincia}")
    public List<Albergue> buscarPorProvincia(@PathVariable String provincia) {
        return albergueService.buscarPorProvincia(provincia);
    }
}