package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.Cliente;
import com.example.TaxiWaySarria.Repository.ClienteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public Cliente crearCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public List<Cliente> listarClientes() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    public Optional<Cliente> buscarPorNombre(String nombre) {
        return clienteRepository.findByNombre(nombre);
    }

    public Cliente actualizarCliente(Long id, Cliente clienteActualizado) {
        return clienteRepository.findById(id)
                .map(cliente -> {
                    cliente.setNombre(clienteActualizado.getNombre());
                    cliente.setApellidos(clienteActualizado.getApellidos());
                    cliente.setEmail(clienteActualizado.getEmail());
                    cliente.setTelefono(clienteActualizado.getTelefono());
                    return clienteRepository.save(cliente);
                })
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + id));
    }

    public void eliminarCliente(Long id) {
        clienteRepository.deleteById(id);
    }
}