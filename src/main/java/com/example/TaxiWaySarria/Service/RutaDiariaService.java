package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.RutaDiaria;
import com.example.TaxiWaySarria.Model.Repartidor;
import com.example.TaxiWaySarria.Repository.RutaDiariaRepository;
import com.example.TaxiWaySarria.Repository.RepartidorRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class RutaDiariaService {

    private final RutaDiariaRepository rutaDiariaRepository;
    private final RepartidorRepository repartidorRepository;

    public RutaDiariaService(RutaDiariaRepository rutaDiariaRepository,
                             RepartidorRepository repartidorRepository) {
        this.rutaDiariaRepository = rutaDiariaRepository;
        this.repartidorRepository = repartidorRepository;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTODOS CRUD BÁSICOS
    // ═══════════════════════════════════════════════════════════════════════════

    public List<RutaDiaria> listarTodas() {
        return rutaDiariaRepository.findAll();
    }

    public RutaDiaria buscarPorId(Long id) {
        return rutaDiariaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ruta diaria no encontrada con ID: " + id));
    }

    public RutaDiaria crear(RutaDiaria rutaDiaria) {
        return rutaDiariaRepository.save(rutaDiaria);
    }

    public RutaDiaria actualizar(Long id, RutaDiaria rutaDiaria) {
        RutaDiaria rutaExistente = buscarPorId(id);

        if (rutaDiaria.getFecha() != null) {
            rutaExistente.setFecha(rutaDiaria.getFecha());
        }
        if (rutaDiaria.getRepartidor() != null) {
            rutaExistente.setRepartidor(rutaDiaria.getRepartidor());
        }
        if (rutaDiaria.getEstado() != null) {
            rutaExistente.setEstado(rutaDiaria.getEstado());
        }

        return rutaDiariaRepository.save(rutaExistente);
    }

    public void eliminar(Long id) {
        rutaDiariaRepository.deleteById(id);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ MÉTODO NUEVO: Buscar rutas por fecha
    // ═══════════════════════════════════════════════════════════════════════════

    public List<RutaDiaria> buscarPorFecha(LocalDate fecha) {
        return rutaDiariaRepository.findByFecha(fecha);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ MÉTODO NUEVO: Cambiar estado de una ruta
    // ═══════════════════════════════════════════════════════════════════════════

    public RutaDiaria cambiarEstado(Long id, String nuevoEstado) {
        RutaDiaria ruta = buscarPorId(id);
        ruta.setEstado(nuevoEstado);
        return rutaDiariaRepository.save(ruta);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTODOS ADICIONALES
    // ═══════════════════════════════════════════════════════════════════════════

    public List<RutaDiaria> buscarPorRepartidor(Long repartidorId) {
        Repartidor repartidor = repartidorRepository.findById(repartidorId)
                .orElseThrow(() -> new RuntimeException("Repartidor no encontrado"));
        return rutaDiariaRepository.findByRepartidor(repartidor);
    }

    public List<RutaDiaria> buscarPorEstado(String estado) {
        return rutaDiariaRepository.findByEstado(estado);
    }
}