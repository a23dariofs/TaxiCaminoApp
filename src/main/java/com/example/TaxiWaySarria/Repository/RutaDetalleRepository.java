package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.RutaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RutaDetalleRepository extends JpaRepository<RutaDetalle, Long> {
    List<RutaDetalle> findByRutaDiariaId(Long id);
}
