package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.RutaDetalle;
import com.example.TaxiWaySarria.Model.RutaDiaria;
import com.example.TaxiWaySarria.Model.Albergue;
import com.example.TaxiWaySarria.Repository.RutaDetalleRepository;
import com.example.TaxiWaySarria.Repository.RutaDiariaRepository;
import com.example.TaxiWaySarria.Repository.AlbergueRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RutaDetalleService {

    private final RutaDetalleRepository rutaDetalleRepository;
    private final RutaDiariaRepository rutaDiariaRepository;
    private final AlbergueRepository albergueRepository;

    public RutaDetalleService(RutaDetalleRepository rutaDetalleRepository,
                              RutaDiariaRepository rutaDiariaRepository,
                              AlbergueRepository albergueRepository) {
        this.rutaDetalleRepository = rutaDetalleRepository;
        this.rutaDiariaRepository = rutaDiariaRepository;
        this.albergueRepository = albergueRepository;
    }

    public List<RutaDetalle> listarTodos() {
        return rutaDetalleRepository.findAll();
    }

    public RutaDetalle buscarPorId(Long id) {
        return rutaDetalleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RutaDetalle no encontrado con id: " + id));
    }

    public RutaDetalle crear(Long rutaId, Long albergueId, Integer orden) {
        RutaDiaria ruta = rutaDiariaRepository.findById(rutaId)
                .orElseThrow(() -> new RuntimeException("RutaDiaria no encontrada"));
        Albergue albergue = albergueRepository.findById(albergueId)
                .orElseThrow(() -> new RuntimeException("Albergue no encontrado"));

        RutaDetalle detalle = new RutaDetalle();
        detalle.setRutaDiaria(ruta);
        detalle.setAlbergue(albergue);
        detalle.setOrden(orden);

        return rutaDetalleRepository.save(detalle);
    }

    public RutaDetalle actualizar(Long id, Integer orden) {
        RutaDetalle detalle = buscarPorId(id);
        detalle.setOrden(orden);
        return rutaDetalleRepository.save(detalle);
    }

    public void eliminar(Long id) {
        rutaDetalleRepository.deleteById(id);
    }

    public List<RutaDetalle> buscarPorRuta(Long rutaId) {
        return rutaDetalleRepository.findByRutaDiariaId(rutaId);
    }
}