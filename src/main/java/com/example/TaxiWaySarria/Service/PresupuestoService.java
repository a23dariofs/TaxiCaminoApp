package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.Cliente;
import com.example.TaxiWaySarria.Model.Presupuesto;
import com.example.TaxiWaySarria.Repository.PresupuestoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PresupuestoService {

    private final PresupuestoRepository presupuestoRepository;

    @Autowired
    private JavaMailSender mailSender;

    public PresupuestoService(PresupuestoRepository presupuestoRepository) {
        this.presupuestoRepository = presupuestoRepository;
    }

    public List<Presupuesto> findAll() {
        return presupuestoRepository.findAll();
    }

    public Optional<Presupuesto> findById(Long id) {
        return presupuestoRepository.findById(id);
    }

    public Presupuesto save(Presupuesto presupuesto) {
        return presupuestoRepository.save(presupuesto);
    }

    public void deleteById(Long id) {
        presupuestoRepository.deleteById(id);
    }

    public boolean aceptarPresupuesto(String token) {
        Optional<Presupuesto> presupuestoOpt = presupuestoRepository.findByTokenAceptacion(token);
        if (presupuestoOpt.isPresent()) {
            Presupuesto presupuesto = presupuestoOpt.get();
            presupuesto.setEstado("Aceptado");
            presupuestoRepository.save(presupuesto);
            return true;
        }
        return false;
    }

    public void enviarPorEmail(Long presupuestoId) {
        Presupuesto presupuesto = findById(presupuestoId)
                .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));

        Cliente cliente = presupuesto.getCliente();

        // Generar token único para aceptar/rechazar
        String token = UUID.randomUUID().toString();
        presupuesto.setTokenAceptacion(token);
        presupuesto.setEstado("Enviado");
        save(presupuesto);

        // Construir email
        String asunto = "Presupuesto de Taxicamino";
        String cuerpo = String.format("""
            Hola %s,
            
            Te enviamos el presupuesto para tu viaje:
            
            Origen: %s
            Destino: %s
            Fecha: %s
            Precio: %.2f €
            
            Para aceptar el presupuesto, haz clic aquí:
            http://localhost:8080/api/presupuestos/aceptar?token=%s
            
            Saludos,
            Taxicamino
            """,
                cliente.getNombre(),
                presupuesto.getOrigen(),
                presupuesto.getDestino(),
                presupuesto.getFechaViaje(),
                presupuesto.getPrecioTotal(),
                token
        );

        // Enviar
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setTo(cliente.getEmail());
        mensaje.setSubject(asunto);
        mensaje.setText(cuerpo);
        mailSender.send(mensaje);
    }
}
