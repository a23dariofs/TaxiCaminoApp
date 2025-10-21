package com.example.TaxiWaySarria.Service;


import com.example.TaxiWaySarria.Model.Repartidor;
import com.example.TaxiWaySarria.Model.Reserva;
import com.example.TaxiWaySarria.Model.RutaDiaria;
import com.example.TaxiWaySarria.Repository.RepartidorRepository;
import com.example.TaxiWaySarria.Repository.ReservaRepository;
import com.example.TaxiWaySarria.Repository.RutaDiariaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RepartidorService {

    private final RepartidorRepository repartidorRepository;
    private final ReservaRepository reservaRepository;
    private final RutaDiariaRepository rutaDiariaRepository;

    public RepartidorService(RepartidorRepository repartidorRepository,
                             ReservaRepository reservaRepository,
                             RutaDiariaRepository rutaDiariaRepository) {
        this.repartidorRepository = repartidorRepository;
        this.reservaRepository = reservaRepository;
        this.rutaDiariaRepository = rutaDiariaRepository;
    }

    // CRUD básico
    public List<Repartidor> listarTodos() {
        return repartidorRepository.findAll();
    }

    public Repartidor buscarPorId(Long id) {
        return repartidorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Repartidor no encontrado"));
    }

    public Repartidor crear(Repartidor repartidor) {
        return repartidorRepository.save(repartidor);
    }

    public Repartidor actualizar(Long id, Repartidor datos) {
        Repartidor repartidor = buscarPorId(id);
        repartidor.setNombre(datos.getNombre());
        repartidor.setTelefono(datos.getTelefono());
        repartidor.setEmail(datos.getEmail());
        return repartidorRepository.save(repartidor);
    }

    public void eliminar(Long id) {
        repartidorRepository.deleteById(id);
    }

    // Gestión de reservas
    public Repartidor asignarReserva(Long repartidorId, Long reservaId) {
        Repartidor repartidor = buscarPorId(repartidorId);
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        repartidor.getReservas().add(reserva);
        return repartidorRepository.save(repartidor);
    }

    public Repartidor quitarReserva(Long repartidorId, Long reservaId) {
        Repartidor repartidor = buscarPorId(repartidorId);
        repartidor.getReservas().removeIf(r -> r.getId().equals(reservaId));
        return repartidorRepository.save(repartidor);
    }

    // Gestión de rutas diarias
    public Repartidor asignarRuta(Long repartidorId, Long rutaId) {
        Repartidor repartidor = buscarPorId(repartidorId);
        RutaDiaria ruta = rutaDiariaRepository.findById(rutaId)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

        ruta.setRepartidor(repartidor);
        rutaDiariaRepository.save(ruta);

        repartidor.getRutasDiarias().add(ruta);
        return repartidorRepository.save(repartidor);
    }

    public Repartidor quitarRuta(Long repartidorId, Long rutaId) {
        Repartidor repartidor = buscarPorId(repartidorId);
        repartidor.getRutasDiarias().removeIf(r -> r.getId().equals(rutaId));
        return repartidorRepository.save(repartidor);
    }
}