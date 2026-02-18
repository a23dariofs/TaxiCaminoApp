package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.EtapaCamino;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EtapaCaminoRepository extends JpaRepository<EtapaCamino, Long> {

    // Buscar todas las etapas de una reserva
    List<EtapaCamino> findByReservaId(Long reservaId);

    // Buscar etapas de una reserva ordenadas por orden
    List<EtapaCamino> findByReservaIdOrderByOrdenAsc(Long reservaId);

    // Buscar etapas por fecha
    List<EtapaCamino> findByFecha(LocalDate fecha);

    // Buscar etapas por albergue de salida
    List<EtapaCamino> findByAlojamientoSalidaId(Long albergueId);

    // Buscar etapas por albergue de destino
    List<EtapaCamino> findByAlojamientoDestinoId(Long albergueId);
}
