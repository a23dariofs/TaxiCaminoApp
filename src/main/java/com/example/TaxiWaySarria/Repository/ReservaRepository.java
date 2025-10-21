package com.example.TaxiWaySarria.Repository;


import com.example.TaxiWaySarria.Model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    List<Reserva> findByClienteId(Long clienteId);
    List<Reserva> findByEstado(String estado);
}