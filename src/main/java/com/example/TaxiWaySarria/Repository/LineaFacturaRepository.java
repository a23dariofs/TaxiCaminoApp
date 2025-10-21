package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.LineaFactura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LineaFacturaRepository extends JpaRepository<LineaFactura, Long> {
    List<LineaFactura> findByFacturaId(Long facturaId);
}