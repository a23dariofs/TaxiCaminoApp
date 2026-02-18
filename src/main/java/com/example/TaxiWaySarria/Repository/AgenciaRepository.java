package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.Agencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgenciaRepository extends JpaRepository<Agencia, Long> {

    // Buscar agencia por nombre
    Optional<Agencia> findByNombre(String nombre);

    // Buscar agencias por nombre que contenga (búsqueda parcial)
    List<Agencia> findByNombreContainingIgnoreCase(String nombre);

    // Buscar por email
    Optional<Agencia> findByEmail(String email);
}