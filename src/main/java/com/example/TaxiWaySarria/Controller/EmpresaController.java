package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.Empresa;
import com.example.TaxiWaySarria.Repository.EmpresaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empresas")
@CrossOrigin(origins = "*")
public class EmpresaController {

    private final EmpresaRepository empresaRepository;

    public EmpresaController(EmpresaRepository empresaRepository) {
        this.empresaRepository = empresaRepository;
    }

    @GetMapping
    public List<Empresa> listarTodas() {
        return empresaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Empresa> obtenerPorId(@PathVariable Long id) {
        return empresaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Empresa crear(@RequestBody Empresa empresa) {
        return empresaRepository.save(empresa);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Empresa> actualizar(@PathVariable Long id, @RequestBody Empresa empresaActualizada) {
        return empresaRepository.findById(id)
                .map(empresa -> {
                    empresa.setNombre(empresaActualizada.getNombre());
                    empresa.setTelefono(empresaActualizada.getTelefono());
                    empresa.setEmail(empresaActualizada.getEmail());
                    empresa.setContacto(empresaActualizada.getContacto());
                    empresa.setDireccion(empresaActualizada.getDireccion());
                    return ResponseEntity.ok(empresaRepository.save(empresa));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (empresaRepository.existsById(id)) {
            empresaRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}