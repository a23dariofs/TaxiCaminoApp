package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.Cliente;
import com.example.TaxiWaySarria.Model.Reserva;
import com.example.TaxiWaySarria.Repository.ClienteRepository;
import com.example.TaxiWaySarria.Repository.ReservaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final ClienteRepository clienteRepository;

    public ReservaService(ReservaRepository reservaRepository, ClienteRepository clienteRepository) {
        this.reservaRepository = reservaRepository;
        this.clienteRepository = clienteRepository;
    }

    public List<Reserva> listarTodas() {
        return reservaRepository.findAll();
    }

    public Optional<Reserva> buscarPorId(Long id) {
        return reservaRepository.findById(id);
    }

    public Reserva crearReserva(Long clienteId, Reserva reserva) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        reserva.setCliente(cliente);
        reserva.setEstado("pendiente");
        return reservaRepository.save(reserva);
    }

    public Reserva actualizarEstado(Long id, String nuevoEstado) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        reserva.setEstado(nuevoEstado);
        return reservaRepository.save(reserva);
    }

    public void eliminar(Long id) {
        reservaRepository.deleteById(id);
    }

    public List<Reserva> buscarPorCliente(Long clienteId) {
        return reservaRepository.findByClienteId(clienteId);
    }

    public List<Reserva> buscarPorEstado(String estado) {
        return reservaRepository.findByEstado(estado);
    }
}