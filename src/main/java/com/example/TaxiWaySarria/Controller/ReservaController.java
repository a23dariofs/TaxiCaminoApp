package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.DTOs.ReservaDTO;
import com.example.TaxiWaySarria.Model.Reserva;
import com.example.TaxiWaySarria.Service.ReservaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @GetMapping
    public List<Reserva> listarTodas() {
        return reservaService.listarTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reserva> buscarPorId(@PathVariable Long id) {
        return reservaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ NUEVO: Crear reserva completa con etapas del Camino
    // ═══════════════════════════════════════════════════════════════════════════
    @PostMapping("/completa")
    public ResponseEntity<Reserva> crearReservaCompleta(@RequestBody ReservaDTO reservaDTO) {
        try {
            Reserva reserva = reservaService.crearReservaCompleta(reservaDTO);
            return ResponseEntity.ok(reserva);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}/estado")
    public Reserva actualizarEstado(@PathVariable Long id, @RequestParam String estado) {
        return reservaService.actualizarEstado(id, estado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        reservaService.eliminar(id);
        return ResponseEntity.ok("Reserva eliminada");
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Reserva> buscarPorCliente(@PathVariable Long clienteId) {
        return reservaService.buscarPorCliente(clienteId);
    }

    @GetMapping("/estado/{estado}")
    public List<Reserva> buscarPorEstado(@PathVariable String estado) {
        return reservaService.buscarPorEstado(estado);
    }
}