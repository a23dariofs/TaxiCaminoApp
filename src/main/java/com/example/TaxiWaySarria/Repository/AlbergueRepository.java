package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.Albergue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlbergueRepository extends JpaRepository<Albergue, Long> {
    List<Albergue> findByCiudad(String ciudad);
    List<Albergue> findByProvincia(String provincia);
}
