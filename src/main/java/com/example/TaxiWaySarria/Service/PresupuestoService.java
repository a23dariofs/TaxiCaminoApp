package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.Presupuesto;
import com.example.TaxiWaySarria.Repository.PresupuestoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PresupuestoService {

    private final PresupuestoRepository presupuestoRepository;

    public PresupuestoService(PresupuestoRepository presupuestoRepository) {
        this.presupuestoRepository = presupuestoRepository;
    }

    public List<Presupuesto> findAll() {
        return presupuestoRepository.findAll();
    }

    public Optional<Presupuesto> findById(Long id) {
        return presupuestoRepository.findById(id);
    }

    public Presupuesto save(Presupuesto presupuesto) {
        return presupuestoRepository.save(presupuesto);
    }

    public void deleteById(Long id) {
        presupuestoRepository.deleteById(id);
    }

    public boolean aceptarPresupuesto(String token) {
        Optional<Presupuesto> presupuestoOpt = presupuestoRepository.findByTokenAceptacion(token);
        if (presupuestoOpt.isPresent()) {
            Presupuesto presupuesto = presupuestoOpt.get();
            presupuesto.setEstado("ACEPTADO");
            presupuestoRepository.save(presupuesto);
            return true;
        }
        return false;
    }
}
