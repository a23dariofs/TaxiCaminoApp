package com.example.TaxiWaySarria.Repository;

import com.example.TaxiWaySarria.Model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByEmail(String email);
    Optional<Cliente> findByNombre(String nombre);
}


