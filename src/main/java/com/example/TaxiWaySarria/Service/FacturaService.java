package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.Cliente;
import com.example.TaxiWaySarria.Model.Factura;
import com.example.TaxiWaySarria.Repository.ClienteRepository;
import com.example.TaxiWaySarria.Repository.FacturaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final ClienteRepository clienteRepository;

    public FacturaService(FacturaRepository facturaRepository, ClienteRepository clienteRepository) {
        this.facturaRepository = facturaRepository;
        this.clienteRepository = clienteRepository;
    }

    public List<Factura> listarTodas() {
        return facturaRepository.findAll();
    }

    public Factura buscarPorId(Long id) {
        return facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada con id: " + id));
    }

    public Factura crear(Long clienteId, Factura factura) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + clienteId));

        factura.setCliente(cliente);
        factura.setFechaEmision(LocalDate.now()); // siempre se genera con la fecha actual
        return facturaRepository.save(factura);
    }

    public Factura actualizar(Long id, Factura facturaActualizada) {
        Factura factura = buscarPorId(id);

        if (facturaActualizada.getFechaEmision() != null) {
            factura.setFechaEmision(facturaActualizada.getFechaEmision());
        }
        if (facturaActualizada.getFechaPago() != null) {
            factura.setFechaPago(facturaActualizada.getFechaPago());
        }
        if (facturaActualizada.getImporteTotal() != null) {
            factura.setImporteTotal(facturaActualizada.getImporteTotal());
        }
        if (facturaActualizada.getEstado() != null) {
            factura.setEstado(facturaActualizada.getEstado());
        }
        if (facturaActualizada.getMetodoPago() != null) {
            factura.setMetodoPago(facturaActualizada.getMetodoPago());
        }
        if (facturaActualizada.getConcepto() != null) {
            factura.setConcepto(facturaActualizada.getConcepto());
        }

        return facturaRepository.save(factura);
    }

    public void eliminar(Long id) {
        facturaRepository.deleteById(id);
    }

    public List<Factura> listarPorCliente(Long clienteId) {
        return facturaRepository.findByClienteId(clienteId);
    }
}
