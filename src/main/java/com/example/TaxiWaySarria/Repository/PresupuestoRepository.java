package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
    Optional<Presupuesto> findByTokenAceptacion(String token);
}
