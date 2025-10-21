package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.Factura;
import com.example.TaxiWaySarria.Service.FacturaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facturas")
public class FacturaController {

    private final FacturaService facturaService;

    public FacturaController(FacturaService facturaService) {
        this.facturaService = facturaService;
    }

    @GetMapping
    public List<Factura> listarTodas() {
        return facturaService.listarTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Factura> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(facturaService.buscarPorId(id));
    }

    @PostMapping("/cliente/{clienteId}")
    public ResponseEntity<Factura> crear(@PathVariable Long clienteId, @RequestBody Factura factura) {
        return ResponseEntity.ok(facturaService.crear(clienteId, factura));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Factura> actualizar(@PathVariable Long id, @RequestBody Factura factura) {
        return ResponseEntity.ok(facturaService.actualizar(id, factura));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        facturaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Factura> listarPorCliente(@PathVariable Long clienteId) {
        return facturaService.listarPorCliente(clienteId);
    }
}
