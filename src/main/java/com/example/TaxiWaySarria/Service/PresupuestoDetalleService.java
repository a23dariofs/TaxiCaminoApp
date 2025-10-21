package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.Albergue;
import com.example.TaxiWaySarria.Model.Presupuesto;
import com.example.TaxiWaySarria.Model.PresupuestoDetalle;
import com.example.TaxiWaySarria.Repository.AlbergueRepository;
import com.example.TaxiWaySarria.Repository.PresupuestoDetalleRepository;
import com.example.TaxiWaySarria.Repository.PresupuestoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PresupuestoDetalleService {

    private final PresupuestoDetalleRepository detalleRepository;
    private final PresupuestoRepository presupuestoRepository;
    private final AlbergueRepository albergueRepository;

    public PresupuestoDetalleService(PresupuestoDetalleRepository detalleRepository,
                                     PresupuestoRepository presupuestoRepository,
                                     AlbergueRepository albergueRepository) {
        this.detalleRepository = detalleRepository;
        this.presupuestoRepository = presupuestoRepository;
        this.albergueRepository = albergueRepository;
    }

    public List<PresupuestoDetalle> listarTodos() {
        return detalleRepository.findAll();
    }

    public PresupuestoDetalle buscarPorId(Long id) {
        return detalleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PresupuestoDetalle no encontrado con id: " + id));
    }

    public PresupuestoDetalle crear(Long presupuestoId, Long albergueId, Integer orden) {
        Presupuesto presupuesto = presupuestoRepository.findById(presupuestoId)
                .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));
        Albergue albergue = albergueRepository.findById(albergueId)
                .orElseThrow(() -> new RuntimeException("Albergue no encontrado"));

        PresupuestoDetalle detalle = new PresupuestoDetalle(presupuesto, albergue, orden);
        return detalleRepository.save(detalle);
    }

    public PresupuestoDetalle actualizar(Long id, Long albergueId, Integer orden) {
        PresupuestoDetalle detalle = buscarPorId(id);
        if (albergueId != null) {
            Albergue albergue = albergueRepository.findById(albergueId)
                    .orElseThrow(() -> new RuntimeException("Albergue no encontrado"));
            detalle.setAlbergue(albergue);
        }
        if (orden != null) {
            detalle.setOrden(orden);
        }
        return detalleRepository.save(detalle);
    }

    public void eliminar(Long id) {
        detalleRepository.deleteById(id);
    }

    public List<PresupuestoDetalle> buscarPorPresupuesto(Long presupuestoId) {
        return detalleRepository.findByPresupuestoId(presupuestoId);
    }
}