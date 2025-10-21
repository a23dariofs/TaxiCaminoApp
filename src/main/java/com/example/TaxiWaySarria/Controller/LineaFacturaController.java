package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.LineaFactura;
import com.example.TaxiWaySarria.Service.LineaFacturaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lineas-factura")
public class LineaFacturaController {

    private final LineaFacturaService lineaFacturaService;

    public LineaFacturaController(LineaFacturaService lineaFacturaService) {
        this.lineaFacturaService = lineaFacturaService;
    }

    @GetMapping
    public List<LineaFactura> listarTodos() {
        return lineaFacturaService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LineaFactura> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(lineaFacturaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<LineaFactura> crear(@RequestParam Long facturaId,
                                              @RequestParam String concepto,
                                              @RequestParam Double importe) {
        return ResponseEntity.ok(lineaFacturaService.crear(facturaId, concepto, importe));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LineaFactura> actualizar(@PathVariable Long id,
                                                   @RequestParam String concepto,
                                                   @RequestParam Double importe) {
        return ResponseEntity.ok(lineaFacturaService.actualizar(id, concepto, importe));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        lineaFacturaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/factura/{facturaId}")
    public List<LineaFactura> buscarPorFactura(@PathVariable Long facturaId) {
        return lineaFacturaService.buscarPorFactura(facturaId);
    }
}