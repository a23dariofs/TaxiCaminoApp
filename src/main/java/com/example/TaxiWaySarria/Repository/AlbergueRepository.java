package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.Albergue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlbergueRepository extends JpaRepository<Albergue, Long> {
    List<Albergue> findByCiudad(String ciudad);
    List<Albergue> findByProvincia(String provincia);
    Optional<Albergue> findByNombre(String nombre);
    List<Albergue> findByNombreContainingIgnoreCase(String nombre);
    Optional<Albergue> findByNombreAndCiudad(String nombre, String ciudad);
}