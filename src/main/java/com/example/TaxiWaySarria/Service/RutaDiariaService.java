package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.Repartidor;
import com.example.TaxiWaySarria.Model.RutaDiaria;
import com.example.TaxiWaySarria.Repository.RepartidorRepository;
import com.example.TaxiWaySarria.Repository.RutaDiariaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class RutaDiariaService {

    private final RutaDiariaRepository rutaDiariaRepository;
    private final RepartidorRepository repartidorRepository;

    public RutaDiariaService(RutaDiariaRepository rutaDiariaRepository, RepartidorRepository repartidorRepository) {
        this.rutaDiariaRepository = rutaDiariaRepository;
        this.repartidorRepository = repartidorRepository;
    }

    // CRUD básico
    public List<RutaDiaria> listarTodas() {
        return rutaDiariaRepository.findAll();
    }

    public RutaDiaria buscarPorId(Long id) {
        return rutaDiariaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RutaDiaria no encontrada"));
    }

    public RutaDiaria crear(RutaDiaria ruta) {
        return rutaDiariaRepository.save(ruta);
    }

    public RutaDiaria actualizar(Long id, RutaDiaria rutaDetalles) {
        RutaDiaria ruta = buscarPorId(id);
        ruta.setFecha(rutaDetalles.getFecha());
        ruta.setEstado(rutaDetalles.getEstado());
        ruta.setDetalles(rutaDetalles.getDetalles());
        return rutaDiariaRepository.save(ruta);
    }

    public void eliminar(Long id) {
        RutaDiaria ruta = buscarPorId(id);
        rutaDiariaRepository.delete(ruta);
    }


    public RutaDiaria asignarRepartidor(Long rutaId, Long repartidorId) {
        RutaDiaria ruta = buscarPorId(rutaId);
        Repartidor repartidor = repartidorRepository.findById(repartidorId)
                .orElseThrow(() -> new RuntimeException("Repartidor no encontrado"));

        ruta.setRepartidor(repartidor);
        return rutaDiariaRepository.save(ruta);
    }


    public List<RutaDiaria> buscarPorFecha(LocalDate fecha) {
        return rutaDiariaRepository.findByFecha(fecha);
    }

    public List<RutaDiaria> buscarPorRepartidor(Long repartidorId) {
        return rutaDiariaRepository.findByRepartidorId(repartidorId);
    }
}
