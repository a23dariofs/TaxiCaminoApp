package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.Factura;
import com.example.TaxiWaySarria.Model.LineaFactura;
import com.example.TaxiWaySarria.Repository.FacturaRepository;
import com.example.TaxiWaySarria.Repository.LineaFacturaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LineaFacturaService {

    private final LineaFacturaRepository lineaFacturaRepository;
    private final FacturaRepository facturaRepository;

    public LineaFacturaService(LineaFacturaRepository lineaFacturaRepository,
                               FacturaRepository facturaRepository) {
        this.lineaFacturaRepository = lineaFacturaRepository;
        this.facturaRepository = facturaRepository;
    }

    public List<LineaFactura> listarTodos() {
        return lineaFacturaRepository.findAll();
    }

    public LineaFactura buscarPorId(Long id) {
        return lineaFacturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LineaFactura no encontrada con id: " + id));
    }

    public LineaFactura crear(Long facturaId, String concepto, Double importe) {
        Factura factura = facturaRepository.findById(facturaId)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));

        LineaFactura linea = new LineaFactura(concepto, importe, factura);
        return lineaFacturaRepository.save(linea);
    }

    public LineaFactura actualizar(Long id, String concepto, Double importe) {
        LineaFactura linea = buscarPorId(id);
        linea.setConcepto(concepto);
        linea.setImporte(importe);
        return lineaFacturaRepository.save(linea);
    }

    public void eliminar(Long id) {
        lineaFacturaRepository.deleteById(id);
    }

    public List<LineaFactura> buscarPorFactura(Long facturaId) {
        return lineaFacturaRepository.findByFacturaId(facturaId);
    }
}
