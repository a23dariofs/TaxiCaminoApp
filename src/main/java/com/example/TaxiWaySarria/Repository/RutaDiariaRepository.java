package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.RutaDiaria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface RutaDiariaRepository extends JpaRepository<RutaDiaria, Long> {
    List<RutaDiaria> findByFecha(LocalDate fecha);
    List<RutaDiaria> findByRepartidorId(Long repartidorId);
}