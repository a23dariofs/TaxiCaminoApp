package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.DTOs.ReservaDTO;
import com.example.TaxiWaySarria.Model.Agencia;
import com.example.TaxiWaySarria.Model.Empresa;
import com.example.TaxiWaySarria.Model.Repartidor;
import com.example.TaxiWaySarria.Model.Reserva;
import com.example.TaxiWaySarria.Repository.AgenciaRepository;
import com.example.TaxiWaySarria.Repository.EmpresaRepository;
import com.example.TaxiWaySarria.Repository.RepartidorRepository;
import com.example.TaxiWaySarria.Repository.ReservaRepository;
import com.example.TaxiWaySarria.Service.ReservaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;
    private final AgenciaRepository agenciaRepository;
    private final EmpresaRepository empresaRepository;
    private final RepartidorRepository repartidorRepository;
    private final ReservaRepository reservaRepository;

    public ReservaController(ReservaService reservaService, AgenciaRepository agenciaRepository, EmpresaRepository empresaRepository, RepartidorRepository repartidorRepository, ReservaRepository reservaRepository) {
        this.reservaService = reservaService;
        this.agenciaRepository = agenciaRepository;
        this.empresaRepository = empresaRepository;
        this.repartidorRepository = repartidorRepository;
        this.reservaRepository = reservaRepository;
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
            System.out.println("JSON RECIBIDO:");
            System.out.println(reservaDTO);

            Reserva reserva = reservaService.crearReservaCompleta(reservaDTO);
            return ResponseEntity.ok(reserva);
        } catch (Exception e) {
            e.printStackTrace();   // 👈 CLAVE
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

    @PostMapping("/{id}/generar-etiquetas")
    public ResponseEntity<?> generarEtiquetas(@PathVariable Long id) {
        try {
            reservaService.generarYEnviarEtiquetas(id);
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Etiquetas generadas y enviadas correctamente",
                    "reservaId", id
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Actualizar reserva (para el modal de edición)
     * PUT /api/reservas/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarReserva(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        try {
            Reserva reserva = reservaService.buscarPorId(id)
                    .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

            // Actualizar agencia
            if (updates.containsKey("agenciaNombre")) {
                String agenciaNombre = (String) updates.get("agenciaNombre");
                if (agenciaNombre != null && !agenciaNombre.trim().isEmpty()) {
                    Agencia agencia = agenciaRepository.findByNombre(agenciaNombre.trim())
                            .orElseGet(() -> {
                                Agencia nueva = new Agencia();
                                nueva.setNombre(agenciaNombre.trim());
                                return agenciaRepository.save(nueva);
                            });
                    reserva.setAgencia(agencia);
                }
            }

            // Actualizar empresa
            if (updates.containsKey("empresaNombre")) {
                String empresaNombre = (String) updates.get("empresaNombre");
                if (empresaNombre != null && !empresaNombre.trim().isEmpty()) {
                    Empresa empresa = empresaRepository.findByNombre(empresaNombre.trim())
                            .orElseGet(() -> {
                                Empresa nueva = new Empresa();
                                nueva.setNombre(empresaNombre.trim());
                                return empresaRepository.save(nueva);
                            });
                    reserva.setEmpresa(empresa);
                }
            }

            // Actualizar repartidor
            if (updates.containsKey("repartidorId")) {
                Object repartidorIdObj = updates.get("repartidorId");
                if (repartidorIdObj != null) {
                    Long repartidorId = Long.valueOf(repartidorIdObj.toString());
                    Repartidor repartidor = repartidorRepository.findById(repartidorId).orElse(null);
                    reserva.setRepartidor(repartidor);
                } else {
                    reserva.setRepartidor(null);
                }
            }

            // Actualizar estado
            if (updates.containsKey("estado")) {
                reserva.setEstado((String) updates.get("estado"));
            }

            // Actualizar observaciones
            if (updates.containsKey("observaciones")) {
                reserva.setObservaciones((String) updates.get("observaciones"));
            }

            reserva = reservaRepository.save(reserva);
            return ResponseEntity.ok(reserva);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
































































































}