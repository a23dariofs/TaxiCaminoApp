package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.Factura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FacturaRepository extends JpaRepository<Factura, Long> {
    List<Factura> findByClienteId(Long clienteId);
}