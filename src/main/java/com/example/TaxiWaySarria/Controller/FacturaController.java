package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.Model.Factura;
import com.example.TaxiWaySarria.Service.FacturaService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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

    // ═══════════════════════════════════════════════════════════════════════════
    // NUEVO: Generar factura PDF para agencia
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Genera un PDF de factura para una agencia en un periodo específico
     * POST /api/facturas/generar-pdf-agencia
     */
    @PostMapping("/generar-pdf-agencia")
    public ResponseEntity<byte[]> generarFacturaPDFAgencia(@RequestBody Map<String, Object> request) {
        try {
            Long agenciaId = Long.valueOf(request.get("agenciaId").toString());
            LocalDate fechaInicio = LocalDate.parse(request.get("fechaInicio").toString());
            LocalDate fechaFin = LocalDate.parse(request.get("fechaFin").toString());

            @SuppressWarnings("unchecked")
            List<Object> reservasIdsObj = (List<Object>) request.get("reservasIds");

            // Convertir a Long
            List<Long> reservasIds = reservasIdsObj.stream()
                    .map(id -> Long.valueOf(id.toString()))
                    .collect(java.util.stream.Collectors.toList());

            byte[] pdfBytes = facturaService.generarFacturaPDFAgencia(agenciaId, fechaInicio, fechaFin, reservasIds);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                    ContentDisposition.builder("attachment")
                            .filename("factura_agencia_" + agenciaId + ".pdf")
                            .build()
            );

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/generar-factura-agencia-pdf")
    public ResponseEntity<byte[]> generarFacturaAgenciaPDF(@RequestBody Map<String, Object> facturaData) {
        try {
            byte[] pdfBytes = facturaService.generarFacturaAgenciaPDF(facturaData);

            @SuppressWarnings("unchecked")
            Map<String, String> agencia = (Map<String, String>) facturaData.get("agencia");
            String nombreAgencia = agencia.get("nombre").replaceAll("\\s+", "_");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                    ContentDisposition.builder("attachment")
                            .filename("Factura_" + nombreAgencia + ".pdf")
                            .build()
            );

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}