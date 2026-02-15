package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.RutaDiaria;
import com.example.TaxiWaySarria.Model.Repartidor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

public interface RutaDiariaRepository extends JpaRepository<RutaDiaria, Long> {
    List<RutaDiaria> findByFecha(LocalDate fecha);

    List<RutaDiaria> findByRepartidorId(Long repartidorId);

    // Buscar rutas por repartidor
    List<RutaDiaria> findByRepartidor(Repartidor repartidor);

    // Buscar rutas por estado
    List<RutaDiaria> findByEstado(String estado);

    // Buscar rutas por repartidor y fecha
    List<RutaDiaria> findByRepartidorAndFecha(Repartidor repartidor, LocalDate fecha);

    // Buscar rutas por repartidor y estado
    List<RutaDiaria> findByRepartidorAndEstado(Repartidor repartidor, String estado);
}




