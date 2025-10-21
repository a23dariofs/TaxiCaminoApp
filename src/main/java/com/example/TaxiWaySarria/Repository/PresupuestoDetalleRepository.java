package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.PresupuestoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PresupuestoDetalleRepository extends JpaRepository<PresupuestoDetalle, Long> {
    List<PresupuestoDetalle> findByPresupuestoId(Long presupuestoId);
}
