package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.Agencia;
import com.example.TaxiWaySarria.Repository.AgenciaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agencias")
public class AgenciaController {

    private final AgenciaRepository agenciaRepository;

    public AgenciaController(AgenciaRepository agenciaRepository) {
        this.agenciaRepository = agenciaRepository;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LISTAR TODAS LAS AGENCIAS
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping
    public List<Agencia> listarTodas() {
        return agenciaRepository.findAll();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OBTENER AGENCIA POR ID
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/{id}")
    public ResponseEntity<Agencia> obtenerPorId(@PathVariable Long id) {
        return agenciaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREAR NUEVA AGENCIA
    // ═══════════════════════════════════════════════════════════════════════════
    @PostMapping
    public Agencia crear(@RequestBody Agencia agencia) {
        return agenciaRepository.save(agencia);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTUALIZAR AGENCIA
    // ═══════════════════════════════════════════════════════════════════════════
    @PutMapping("/{id}")
    public ResponseEntity<Agencia> actualizar(@PathVariable Long id, @RequestBody Agencia agenciaActualizada) {
        return agenciaRepository.findById(id)
                .map(agencia -> {
                    agencia.setNombre(agenciaActualizada.getNombre());
                    agencia.setTelefono(agenciaActualizada.getTelefono());
                    agencia.setEmail(agenciaActualizada.getEmail());
                    agencia.setContacto(agenciaActualizada.getContacto());
                    agencia.setDireccion(agenciaActualizada.getDireccion());
                    return ResponseEntity.ok(agenciaRepository.save(agencia));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ELIMINAR AGENCIA
    // ═══════════════════════════════════════════════════════════════════════════
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (agenciaRepository.existsById(id)) {
            agenciaRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BUSCAR AGENCIA POR NOMBRE
    // ═══════════════════════════════════════════════════════════════════════════
    @GetMapping("/buscar")
    public List<Agencia> buscarPorNombre(@RequestParam String nombre) {
        return agenciaRepository.findByNombreContainingIgnoreCase(nombre);
    }
}