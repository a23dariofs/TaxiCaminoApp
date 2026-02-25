package com.example.TaxiWaySarria.Controller;

import com.example.TaxiWaySarria.DTOs.EtapaRutaDiariaDTO;
import com.example.TaxiWaySarria.Model.EtapaCamino;
import com.example.TaxiWaySarria.Repository.EtapaCaminoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/etapas")
@CrossOrigin(origins = "*")
public class EtapaCaminoController {

    private final EtapaCaminoRepository etapaCaminoRepository;

    public EtapaCaminoController(EtapaCaminoRepository etapaCaminoRepository) {
        this.etapaCaminoRepository = etapaCaminoRepository;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ ENDPOINT: Obtener todas las etapas de una fecha (USANDO DTO)
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping("/fecha/{fecha}")
    public ResponseEntity<List<EtapaRutaDiariaDTO>> obtenerEtapasPorFecha(@PathVariable String fecha) {
        try {
            LocalDate fechaBusqueda = LocalDate.parse(fecha);
            List<EtapaCamino> etapas = etapaCaminoRepository.findByFecha(fechaBusqueda);

            System.out.println("📅 Buscando etapas para fecha: " + fecha);
            System.out.println("✅ Encontradas " + etapas.size() + " etapas");

            // Convertir a DTO para evitar problemas de serialización
            List<EtapaRutaDiariaDTO> etapasDTO = etapas.stream()
                    .map(this::convertirADTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(etapasDTO);

        } catch (Exception e) {
            System.err.println("❌ Error al buscar etapas por fecha: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTODO PRIVADO: Convertir EtapaCamino a DTO
    // ═══════════════════════════════════════════════════════════════════════════

    private EtapaRutaDiariaDTO convertirADTO(EtapaCamino etapa) {
        EtapaRutaDiariaDTO dto = new EtapaRutaDiariaDTO();

        dto.setId(etapa.getId());
        dto.setFecha(etapa.getFecha());
        dto.setCantidadMochilas(etapa.getCantidadMochilas());
        dto.setPrecioTotal(etapa.getPrecioTotal());
        dto.setComentarios(etapa.getComentarios());
        dto.setEstado(etapa.getEstado());
        dto.setOrden(etapa.getOrden());

        // Alojamiento salida
        if (etapa.getAlojamientoSalida() != null) {
            dto.setOrigenNombre(etapa.getAlojamientoSalida().getNombre());
            dto.setOrigenCiudad(etapa.getAlojamientoSalida().getCiudad());
        }

        // Alojamiento destino
        if (etapa.getAlojamientoDestino() != null) {
            dto.setDestinoNombre(etapa.getAlojamientoDestino().getNombre());
            dto.setDestinoCiudad(etapa.getAlojamientoDestino().getCiudad());
        }

        // Datos de la reserva
        if (etapa.getReserva() != null) {
            dto.setObservaciones(etapa.getReserva().getObservaciones());

            // Cliente
            if (etapa.getReserva().getCliente() != null) {
                dto.setClienteNombre(etapa.getReserva().getCliente().getNombre());
                dto.setClienteApellidos(etapa.getReserva().getCliente().getApellidos());
                dto.setClienteTelefono(etapa.getReserva().getCliente().getTelefono());
            }

            // Agencia
            if (etapa.getReserva().getAgencia() != null) {
                dto.setAgenciaNombre(etapa.getReserva().getAgencia().getNombre());
            }

            // Empresa
            if (etapa.getReserva().getEmpresa() != null) {
                dto.setEmpresaNombre(etapa.getReserva().getEmpresa().getNombre());
            }
        }

        return dto;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OTROS ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping
    public List<EtapaCamino> listarTodas() {
        return etapaCaminoRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EtapaCamino> buscarPorId(@PathVariable Long id) {
        return etapaCaminoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reserva/{reservaId}")
    public List<EtapaCamino> obtenerEtapasPorReserva(@PathVariable Long reservaId) {
        return etapaCaminoRepository.findByReservaIdOrderByOrdenAsc(reservaId);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<EtapaCamino> cambiarEstado(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        try {
            String nuevoEstado = body.get("estado");

            if (nuevoEstado == null || nuevoEstado.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            EtapaCamino etapa = etapaCaminoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Etapa no encontrada con ID: " + id));

            etapa.setEstado(nuevoEstado);
            etapa = etapaCaminoRepository.save(etapa);

            System.out.println("✅ Estado de etapa " + id + " cambiado a: " + nuevoEstado);

            return ResponseEntity.ok(etapa);

        } catch (Exception e) {
            System.err.println("❌ Error cambiando estado de etapa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}